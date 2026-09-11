// @vitest-environment jsdom
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VerifyDocument } from "./VerifyDocument";

let root: Root;

beforeEach(() => {
  localStorage.clear();
  const container = window.document.createElement("div");
  window.document.body.replaceChildren(container);
  root = createRoot(container);
});

afterEach(() => {
  root.unmount();
  vi.unstubAllGlobals();
});

async function renderVerification(token: string) {
  root.render(
    <MemoryRouter initialEntries={[`/verify/${token}`]}>
      <Routes><Route path="/verify/:verificationToken" element={<VerifyDocument />} /></Routes>
    </MemoryRouter>,
  );
  await vi.waitFor(() => expect(window.document.body.textContent).toContain("Document Verified"));
}

async function renderMissingVerification(token: string) {
  root.render(
    <MemoryRouter initialEntries={[`/verify/${token}`]}>
      <Routes><Route path="/verify/:verificationToken" element={<VerifyDocument />} /></Routes>
    </MemoryRouter>,
  );
  await vi.waitFor(() => expect(window.document.body.textContent).toContain("Document Not Found"));
}

describe("document verification", () => {
  it("renders a locally stored document as verified", async () => {
    localStorage.setItem("cms_documents", JSON.stringify([{
      id: "DOC-LOCAL", documentNumber: "DOC-LOCAL", verificationToken: "local-token", verificationUrl: "/verify/local-token",
      recipientName: "Local User", documentTitle: "Document of Completion", courseName: "Security", issueDate: "2026-01-01",
      organization: "KBZ", documentType: "completion", email: "local@example.com", status: "VALID", createdAt: "2026-01-01",
    }]));
    await renderVerification("local-token");
    expect(window.document.body.textContent).toContain("Document Verified");
    expect(window.document.body.textContent).toContain("Local User");
  });

  it("renders a document-shaped verification API response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      id: "DOC-API", documentNumber: "DOC-API", verificationToken: "api-token", verificationUrl: "/verify/api-token",
      recipientName: "API User", documentTitle: "Document of Completion", courseName: "Security", issueDate: "2026-01-01",
      organization: "KBZ", documentType: "completion", email: "api@example.com", status: "VALID", createdAt: "2026-01-01",
    }) }));
    await renderVerification("api-token");
    expect(window.document.body.textContent).toContain("Document Verified");
    expect(window.document.body.textContent).toContain("API User");
  });

  it("does not fall back to the API for a locally deleted document", async () => {
    localStorage.setItem("cms_deleted_document_tokens", JSON.stringify(["deleted-token"]));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({
      id: "DOC-API", verificationToken: "deleted-token", recipientName: "Deleted User", status: "VALID",
    }) }));

    await renderMissingVerification("deleted-token");

    expect(window.document.body.textContent).not.toContain("Deleted User");
    expect(fetch).not.toHaveBeenCalled();
  });
});