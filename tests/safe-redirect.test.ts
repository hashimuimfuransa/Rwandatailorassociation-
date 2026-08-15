import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/safe-redirect";

/**
 * Open-redirect regression tests.
 *
 * The threat: a login link whose `next` parameter points at an attacker's
 * lookalike site. The user authenticates on the genuine domain, is redirected
 * away, and re-enters credentials on the copy — with the trust earned by
 * having started on the real site.
 */
describe("safeRedirectPath", () => {
  it("allows same-site absolute paths", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("/admin/members?page=2")).toBe("/admin/members?page=2");
    expect(safeRedirectPath("/dashboard/savings#recent")).toBe("/dashboard/savings#recent");
  });

  it("rejects absolute URLs to other origins", () => {
    expect(safeRedirectPath("https://evil.example.com")).toBeNull();
    expect(safeRedirectPath("http://evil.example.com/dashboard")).toBeNull();
  });

  it("rejects protocol-relative URLs, which browsers treat as absolute", () => {
    // The classic miss: it starts with "/" so a naive check passes it.
    expect(safeRedirectPath("//evil.example.com")).toBeNull();
    expect(safeRedirectPath("//evil.example.com/dashboard")).toBeNull();
  });

  it("rejects backslash variants that some browsers normalise to //", () => {
    expect(safeRedirectPath("/\\evil.example.com")).toBeNull();
  });

  it("rejects percent-encoded attempts to smuggle an origin", () => {
    expect(safeRedirectPath("/%2f%2fevil.example.com")).toBeNull();
    expect(safeRedirectPath("/%2F%2Fevil.example.com")).toBeNull();
  });

  it("rejects non-http schemes", () => {
    expect(safeRedirectPath("javascript:alert(1)")).toBeNull();
    expect(safeRedirectPath("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("rejects CRLF, which could be used for header injection", () => {
    expect(safeRedirectPath("/dashboard\nSet-Cookie: x=y")).toBeNull();
    expect(safeRedirectPath("/dashboard\r\nLocation: https://evil.com")).toBeNull();
  });

  it("rejects relative paths that are not rooted", () => {
    expect(safeRedirectPath("dashboard")).toBeNull();
    expect(safeRedirectPath("../admin")).toBeNull();
  });

  it("refuses to bounce a signed-in user back to auth pages", () => {
    // Would otherwise produce a redirect loop: middleware sends an
    // authenticated user away from /login, straight back to /login.
    expect(safeRedirectPath("/login")).toBeNull();
    expect(safeRedirectPath("/forgot-password")).toBeNull();
    expect(safeRedirectPath("/reset-password?token=x")).toBeNull();
    expect(safeRedirectPath("/api/auth/me")).toBeNull();
  });

  it("handles empty and malformed input", () => {
    expect(safeRedirectPath(null)).toBeNull();
    expect(safeRedirectPath(undefined)).toBeNull();
    expect(safeRedirectPath("")).toBeNull();
    expect(safeRedirectPath("   ")).toBeNull();
    expect(safeRedirectPath("/%")).toBeNull(); // decodeURIComponent throws
  });
});
