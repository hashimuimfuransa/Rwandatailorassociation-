import "server-only";
import { spawn } from "node:child_process";
import path from "node:path";
import { getEnv } from "@/lib/env";
import { paymentLogger, serialiseError } from "@/lib/logger";

/**
 * Bridge to the Python PDF extractor.
 *
 * The statement parser needs the document's *visual rows*, and reconstructing
 * those from a PDF is genuinely hard — the format stores glyphs at
 * coordinates, not a table. The JavaScript attempt fused adjacent columns on
 * real statements, turning a time column running into an amount column into a
 * plausible but wrong number. pdfplumber clusters characters into words with
 * proper per-character geometry, so two columns are always two words.
 *
 * WHY A SUBPROCESS RATHER THAN A SERVICE. Extraction is request-scoped, runs
 * behind an admin-only route, and takes a second or two. A subprocess keeps
 * the PDF bytes on one machine and adds no network hop, no queue and nothing
 * to deploy separately. The bytes go over stdin rather than a temporary file
 * so a statement never touches the disk.
 *
 * WHY IT DEGRADES RATHER THAN FAILS. Not every environment will have Python
 * installed. When it is missing the caller falls back to the JavaScript
 * extractor, which is worse on tight table layouts but not useless — and a
 * missing interpreter should not take the whole import feature down. The mode
 * actually used is reported all the way to the UI, so nobody is misled about
 * which one produced the rows in front of them.
 */

export interface PythonExtractionResult {
  lines: string[];
  pageCount: number;
  wordCount: number;
  /// Pages that yielded no text at all — typically scanned inserts.
  pagesWithoutText: number[];
}

export class PythonUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PythonUnavailableError";
  }
}

/** Reported by the extractor script; `ok:false` carries a readable reason. */
type ScriptResponse =
  | {
      ok: true;
      engine: string;
      pageCount: number;
      lines: string[];
      wordCount: number;
      pagesWithoutText: number[];
    }
  | { ok: false; error: string };

const SCRIPT_PATH = path.join(process.cwd(), "scripts", "pdf_extract.py");

/// Generous: a 200-page statement on a cold Python start is still well inside
/// this, and the alternative to waiting is failing an import that would have
/// worked.
const TIMEOUT_MS = 120_000;

/// A statement's text is small; this only guards against a runaway process.
const MAX_OUTPUT_BYTES = 64 * 1024 * 1024;

/**
 * Runs the Python extractor over a PDF.
 *
 * @throws PythonUnavailableError when the interpreter cannot be started, which
 *   the caller treats as "fall back to JavaScript" rather than as a failure.
 * @throws Error when Python ran but could not read the document — a real
 *   problem with the file that the administrator needs to be told about.
 */
export function extractWithPython(
  buffer: ArrayBuffer
): Promise<PythonExtractionResult> {
  const env = getEnv();

  return new Promise((resolve, reject) => {
    const child = spawn(env.PYTHON_BIN, [SCRIPT_PATH], {
      stdio: ["pipe", "pipe", "pipe"],
      // Inherit the environment but never the shell, so a path with spaces or
      // a shell metacharacter in it cannot be interpreted.
      shell: false,
    });

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let stdoutBytes = 0;
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGKILL");
      reject(new Error("PDF extraction timed out. The document may be very large."));
    }, TIMEOUT_MS);

    function finish(handler: () => void) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      handler();
    }

    child.on("error", (error: NodeJS.ErrnoException) => {
      // ENOENT means the interpreter itself is not on the PATH.
      finish(() =>
        reject(
          error.code === "ENOENT"
            ? new PythonUnavailableError(
                `Python was not found at "${env.PYTHON_BIN}". Set PYTHON_BIN, or install Python and run: pip install -r scripts/requirements.txt`
              )
            : error
        )
      );
    });

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes > MAX_OUTPUT_BYTES) {
        finish(() => {
          child.kill("SIGKILL");
          reject(new Error("The extractor produced an implausible amount of output"));
        });
        return;
      }
      stdout.push(chunk);
    });

    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));

    child.on("close", (code) => {
      finish(() => {
        const out = Buffer.concat(stdout).toString("utf8").trim();
        const err = Buffer.concat(stderr).toString("utf8").trim();

        if (err) {
          paymentLogger.warn({ stderr: err.slice(0, 2000) }, "pdf extractor stderr");
        }

        if (!out) {
          reject(
            new PythonUnavailableError(
              `The PDF extractor produced no output (exit ${code}). ${
                err.slice(0, 300) || "Check that pdfplumber is installed."
              }`
            )
          );
          return;
        }

        let parsed: ScriptResponse;
        try {
          parsed = JSON.parse(out) as ScriptResponse;
        } catch {
          reject(
            new PythonUnavailableError(
              "The PDF extractor returned output that could not be read as JSON"
            )
          );
          return;
        }

        if (!parsed.ok) {
          // Python ran fine and rejected the document: a real, reportable
          // problem with the file rather than a missing dependency.
          const isDependency = parsed.error.includes("pdfplumber is not installed");
          reject(
            isDependency
              ? new PythonUnavailableError(parsed.error)
              : new Error(parsed.error)
          );
          return;
        }

        resolve({
          lines: parsed.lines,
          pageCount: parsed.pageCount,
          wordCount: parsed.wordCount,
          pagesWithoutText: parsed.pagesWithoutText ?? [],
        });
      });
    });

    child.stdin.on("error", (error) => {
      // A closed pipe here means the child died before reading the PDF; the
      // close handler above reports the real reason.
      paymentLogger.debug({ ...serialiseError(error) }, "pdf extractor stdin closed");
    });

    child.stdin.end(Buffer.from(buffer));
  });
}
