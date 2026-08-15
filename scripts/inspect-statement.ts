import "dotenv/config";
import { readFileSync } from "node:fs";
import { getDocumentProxy } from "unpdf";
import {
  extractStatementText,
  parseStatementRows,
} from "../lib/services/statement-import";

/**
 * Statement extraction diagnostic.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/inspect-statement.ts <file.pdf> [maxLines]
 *
 * Prints what the extractor actually sees, in three layers:
 *
 *   1. RAW TEXT ITEMS — what pdf.js reports, with coordinates. This is the
 *      ground truth. If a time and an amount arrive here as ONE item, no
 *      amount of positional logic can separate them and the PDF needs a
 *      different extraction library.
 *   2. RECONSTRUCTED LINES — what the layout pass builds from those items.
 *   3. PARSE RESULT — which lines became transactions, and which did not.
 *
 * Nothing is written and no database is touched.
 */
async function main() {
  const [path, maxLinesArg] = process.argv.slice(2);

  if (!path) {
    console.error(
      "Usage: npx tsx --tsconfig tsconfig.scripts.json scripts/inspect-statement.ts <file.pdf> [maxLines]"
    );
    process.exit(1);
  }

  const maxLines = Number(maxLinesArg) || 40;
  const file = readFileSync(path);
  const buffer = file.buffer.slice(
    file.byteOffset,
    file.byteOffset + file.byteLength
  ) as ArrayBuffer;

  // ---- Layer 1: raw items from page 1 -----------------------------------
  // Copied, because pdf.js detaches the buffer it is handed and the Python
  // pass below still needs the bytes.
  const pdf = await getDocumentProxy(new Uint8Array(buffer.slice(0)));
  const page = await pdf.getPage(1);
  const content = await page.getTextContent();

  console.log(`\n=== PDF: ${path}`);
  console.log(`pages: ${pdf.numPages}   text items on page 1: ${content.items.length}\n`);

  console.log("--- RAW TEXT ITEMS (page 1, first 60) ---");
  console.log("      x        y     width  text");

  let shown = 0;
  for (const raw of content.items) {
    const item = raw as { str?: string; transform?: number[]; width?: number };
    if (typeof item.str !== "string" || item.str.trim() === "") continue;
    if (!Array.isArray(item.transform)) continue;
    if (shown++ >= 60) break;

    console.log(
      `${item.transform[4].toFixed(1).padStart(8)} ` +
        `${item.transform[5].toFixed(1).padStart(8)} ` +
        `${(item.width ?? 0).toFixed(1).padStart(7)}  ` +
        JSON.stringify(item.str)
    );
  }

  // ---- Layer 2: reconstructed lines --------------------------------------
  const { text, pageCount, extractionMode, pagesWithoutText } =
    await extractStatementText(buffer);
  const lines = text.split("\n").filter((line) => line.trim());

  console.log(`\n--- RECONSTRUCTED LINES ---`);
  console.log(`engine: ${extractionMode}   pages: ${pageCount}   lines: ${lines.length}`);
  if (pagesWithoutText.length > 0) {
    console.log(`pages with no text: ${pagesWithoutText.join(", ")}`);
  }
  console.log("");

  for (const line of lines.slice(0, maxLines)) {
    console.log(`  ${line}`);
  }
  if (lines.length > maxLines) {
    console.log(`  … ${lines.length - maxLines} more (pass a larger maxLines to see them)`);
  }

  // ---- Layer 3: what the parser made of them -----------------------------
  const parsed = parseStatementRows(text);

  console.log(`\n--- PARSE RESULT ---`);
  console.log(`coverage:`, parsed.coverage);
  console.log(`account: ${parsed.detectedAccount ?? "not found"}`);
  console.log(`period:`, parsed.detectedPeriod);
  console.log(`totals:`, parsed.totals);

  console.log(`\ntransactions (first 20):`);
  for (const row of parsed.rows.slice(0, 20)) {
    console.log(
      `  ${row.date.toISOString().slice(0, 10)}  ${row.direction.padEnd(6)} ` +
        `${row.amount.padStart(16)}  bal=${(row.balanceAfter ?? "—").padStart(16)}  ` +
        `[${row.confidence}]  ${row.description.slice(0, 60)}`
    );
    if (row.payerName || row.payerPhone) {
      console.log(`        payer: ${row.payerName ?? "—"}  ${row.payerPhone ?? "—"}`);
    }
  }

  if (parsed.unparsedLines.length > 0) {
    console.log(`\nunreadable lines (first 20):`);
    for (const line of parsed.unparsedLines.slice(0, 20)) {
      console.log(`  ${line}`);
    }
  }

  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
