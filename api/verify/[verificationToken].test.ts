import { describe, expect, it, vi } from "vitest";
import handler from "./[verificationToken]";

function response() {
  const json = vi.fn();
  const status = vi.fn(() => ({ status, json }));
  return { status, json };
}

describe("document verification API", () => {
  it("returns a document-shaped payload for a known verification token", () => {
    const res = response();
    handler({ method: "GET", query: { verificationToken: "00000000-0000-4000-8000-000000000001" } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ documentNumber: "DOC-2026-000001", documentTitle: "Document of Completion" }));
  });

  it("returns a document-not-found error for an unknown token", () => {
    const res = response();
    handler({ method: "GET", query: { verificationToken: "missing" } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Document not found" });
  });
});