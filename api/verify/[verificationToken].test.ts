import { describe, expect, it, vi } from "vitest";
import handler from "./[verificationToken]";
vi.mock("../_lib/db", () => ({ parseJson: (value: unknown, fallback: unknown) => typeof value === "string" ? JSON.parse(value) : fallback, serverError: (error: unknown) => error instanceof Error ? error.message : String(error), query: vi.fn(async (_sql: string, values: string[]) => values[0] === "00000000-0000-4000-8000-000000000001" ? [{ document_number: "DOC-2026-000001", short_id: "ABC123XYZ", verification_token: values[0], recipient_name: "Alice", document_title: "Document of Completion", course_name: "Testing", issue_date: "2026-01-01", organization: "KBZ", document_type: "completion", status: "VALID", dynamic_data: "{}", created_at: "2026-01-01" }] : []) }));

function response() {
  const json = vi.fn();
  const status = vi.fn(() => ({ status, json }));
  return { status, json };
}

describe("document verification API", () => {
  it("returns a document-shaped payload for a known verification token", async () => {
    const res = response();
    await handler({ method: "GET", query: { verificationToken: "00000000-0000-4000-8000-000000000001" } }, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ documentNumber: "DOC-2026-000001", documentTitle: "Document of Completion" }));
  });

  it("returns a document-not-found error for an unknown token", async () => {
    const res = response();
    await handler({ method: "GET", query: { verificationToken: "missing" } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Document not found." });
  });
});