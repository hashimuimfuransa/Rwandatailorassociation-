#!/usr/bin/env python3
"""
Bank statement PDF text extraction.

WHY THIS IS PYTHON. Extracting a table from a PDF means reconstructing
structure that the format does not store: a PDF holds glyphs at coordinates,
not rows and columns. Doing that from the JavaScript side meant clustering raw
text items by hand, and it failed on real statements in the worst possible way
-- adjacent columns fused, so a time column running into an amount column
turned "09:44:14" + "21,723,811" into "421,723,811". A wrong description is
cosmetic; a wrong amount is money.

pdfplumber does that clustering properly. `extract_words` groups characters
into words using per-character geometry, so two values in different columns are
always two separate word objects and can never merge. That is the whole reason
for the extra moving part.

CONTRACT. Reads PDF bytes on stdin, writes one JSON object to stdout. It
always writes valid JSON, including on failure, so the Node caller never has to
parse an error out of a traceback. Diagnostics go to stderr.

    {"ok": true, "engine": "pdfplumber", "pageCount": 12,
     "lines": ["...", "..."], "wordCount": 3184, "pagesWithoutText": []}

    {"ok": false, "error": "human readable reason"}

Nothing is written to disk and no network call is made.
"""

import json
import re
import sys

MAX_PAGES = 200

# A row of a statement table starts with a date. Used to decide whether the
# table reader actually found the transactions or just carved up a header.
ROW_START_DATE = re.compile(r"^\s*(?:\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})")

# Horizontal distance, in points, below which two characters are treated as
# belonging to the same word. Deliberately tight: splitting one word into two
# is harmless here, while merging two columns is the failure this exists to
# prevent.
X_TOLERANCE = 1.5

# Vertical tolerance for placing two words on the same visual line. Statement
# rows rarely share an exact baseline -- a taller glyph in one column shifts
# it by a point or so.
Y_TOLERANCE = 3.0


def fail(message):
    json.dump({"ok": False, "error": message}, sys.stdout)
    sys.stdout.flush()
    sys.exit(0)  # 0: the error is in the payload, not the process


def _clean(cell):
    """Collapses a cell's internal wrapping into a single spaced string."""
    return " ".join((cell or "").split())


def _column_indexes(cells):
    """Locates the Debit and Credit columns from a header row, if this is one."""
    debit = credit = None
    for index, cell in enumerate(cells):
        lowered = cell.lower()
        if debit is None and lowered == "debit":
            debit = index
        elif credit is None and lowered == "credit":
            credit = index
    return debit, credit


def build_table_rows(page):
    """
    Reads the statement as a TABLE rather than as lines of text.

    WHY THIS IS NEEDED. Banks wrap a long narration across two or three lines
    inside one cell, while the date, reference and amounts occupy a single
    line and are centred vertically against it. Grouping text by baseline
    therefore tears the narration away from the row it belongs to: the
    transaction arrives with no narration at all, and the narration turns up
    as an orphan line of its own. On a Bank of Kigali statement that lost the
    payer name, the member payment reference and the sending phone number --
    everything the matcher identifies a member by.

    Reading the table puts each row back together, because a wrapped cell is
    still one cell.

    DIRECTION COMES FROM THE COLUMN. Debit and Credit are separate columns, so
    which one holds the amount is the bank stating the direction outright --
    far better evidence than inferring it. That is emitted as a trailing DR/CR
    marker, which the row parser already understands.
    """
    strategies = (
        {"vertical_strategy": "lines", "horizontal_strategy": "lines"},
        {"vertical_strategy": "text", "horizontal_strategy": "text"},
    )

    for settings in strategies:
        try:
            tables = page.extract_tables(settings)
        except Exception as error:  # noqa: BLE001
            print(f"table strategy failed: {error}", file=sys.stderr)
            continue

        rows = []
        debit_index = credit_index = None

        for table in tables or []:
            for raw_row in table:
                cells = [_clean(cell) for cell in raw_row]
                if not any(cells):
                    continue

                header_debit, header_credit = _column_indexes(cells)
                if header_debit is not None or header_credit is not None:
                    # Column positions carry to the rows beneath this header.
                    debit_index = header_debit
                    credit_index = header_credit
                    continue

                text = " ".join(cell for cell in cells if cell).strip()
                if not text:
                    continue

                # Append the bank's own statement of direction when the layout
                # made it unambiguous.
                if debit_index is not None and debit_index < len(cells) and cells[debit_index]:
                    text += " DR"
                elif credit_index is not None and credit_index < len(cells) and cells[credit_index]:
                    text += " CR"

                rows.append(text)

        # Only trust this if it actually found transactions. A table reader can
        # happily carve a page of headings into cells and return nothing of
        # value; rows beginning with a date are the sign it found the ledger.
        dated = sum(1 for row in rows if ROW_START_DATE.match(row))
        if dated >= 3:
            return rows

    return []


def build_lines(page):
    """
    Reconstructs the page's visual lines.

    Uses pdfplumber's own `extract_text_lines`, which groups characters into
    words and words into lines using the full character geometry. Hand-rolling
    that clustering here was tried and is a mistake: when two runs of text
    overlap horizontally -- which happens with kerned or over-positioned
    statements -- sorting words by their left edge interleaves them, and the
    line comes out as shuffled characters. The library already handles the
    cases that make this hard.
    """
    lines = page.extract_text_lines(
        layout=False,
        strip=True,
        return_chars=False,
        x_tolerance=X_TOLERANCE,
        y_tolerance=Y_TOLERANCE,
    )

    return [line["text"] for line in lines if line.get("text", "").strip()]


def main():
    try:
        import pdfplumber
    except ImportError:
        fail(
            "pdfplumber is not installed. Run: pip install -r scripts/requirements.txt"
        )

    data = sys.stdin.buffer.read()
    if not data:
        fail("No PDF data was received on stdin")

    if not data.startswith(b"%PDF-"):
        fail("The data received is not a PDF")

    import io

    try:
        pdf = pdfplumber.open(io.BytesIO(data))
    except Exception as error:  # noqa: BLE001 - reported to the caller as data
        fail(f"The PDF could not be opened: {error}")

    lines = []
    word_count = 0
    pages_without_text = []
    tables_used = 0

    with pdf:
        page_count = len(pdf.pages)

        if page_count > MAX_PAGES:
            fail(
                f"This statement has {page_count} pages, which exceeds the "
                f"{MAX_PAGES}-page limit. Split it into smaller periods."
            )

        for index, page in enumerate(pdf.pages, start=1):
            try:
                # Table first: it is the only reading that keeps a wrapped
                # narration attached to its own transaction. Line clustering
                # is the fallback for statements laid out without a table.
                page_lines = build_table_rows(page)
                if page_lines:
                    tables_used += 1
                else:
                    page_lines = build_lines(page)
                word_count += len(page.chars)
            except Exception as error:  # noqa: BLE001
                # One unreadable page must not lose the other 39. The gap shows
                # up as missing rows in the preview, which the administrator
                # reconciles against the document in front of them.
                print(f"page {index}: {error}", file=sys.stderr)
                pages_without_text.append(index)
                continue

            if not page_lines:
                pages_without_text.append(index)
                continue

            lines.extend(page_lines)

    json.dump(
        {
            "ok": True,
            "engine": "pdfplumber",
            "pageCount": page_count,
            "lines": lines,
            "wordCount": word_count,
            "pagesWithoutText": pages_without_text,
            # How many pages were read as a table rather than as loose lines.
            # A statement where this is 0 had its narrations reassembled by the
            # weaker path, and wrapped cells may be missing.
            "tablePages": tables_used,
        },
        sys.stdout,
        ensure_ascii=False,
    )
    sys.stdout.flush()


if __name__ == "__main__":
    main()
