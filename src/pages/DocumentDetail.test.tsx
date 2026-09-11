// @vitest-environment jsdom
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Document, DocumentTemplate } from "../types";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const template: DocumentTemplate = {
  id: "template-detail",
  name: "Detail template",
  description: "",
  design: "konva",
  status: "ACTIVE",
  createdBy: "admin",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  layout: {
    version: 1,
    canvas: { width: 100, height: 100, pageSize: "A4", orientation: "portrait" },
    elements: [
      { id: "recipient", type: "text", key: "recipient_name", x: 0, y: 0, width: 10, height: 10, rotation: 0 },
      { id: "recipient-copy", type: "text", key: "{{recipient_name}}", x: 0, y: 0, width: 10, height: 10, rotation: 0 },
      { id: "shape", type: "shape", x: 0, y: 0, width: 10, height: 10, rotation: 0 },
      { id: "date", type: "text", key: "completionDate", x: 0, y: 0, width: 10, height: 10, rotation: 0 },
      { id: "missing", type: "text", key: "department", x: 0, y: 0, width: 10, height: 10, rotation: 0 },
      { id: "qr", type: "qr", x: 0, y: 0, width: 10, height: 10, rotation: 0 },
    ],
  },
};

const document: Document = {
  id: "DOC-DETAIL",
  documentNumber: "DOC-DETAIL",
  verificationToken: "detail-token",
  verificationUrl: "/verify/detail-token",
  recipientName: "Legacy Recipient",
  documentTitle: "Completion",
  courseName: "Legacy Course",
  issueDate: "2026-01-01",
  organization: "KBZ BANK",
  documentType: "completion",
  email: "legacy@example.com",
  status: "VALID",
  documentTemplateId: "template-detail",
  dynamicData: { recipient_name: "Dynamic Recipient", completionDate: "2026-09-01" },
  createdAt: "2026-01-01",
};

const missingTemplateDocument = { ...document, id: "DOC-MISSING", documentTemplateId: "missing-template" };
const noFieldsTemplate = { ...template, id: "template-empty", layout: { ...template.layout, elements: [] } };
const noFieldsDocument = { ...document, id: "DOC-EMPTY", documentTemplateId: "template-empty" };

vi.mock("../services/storage", () => ({
  storage: {
    getDocumentById: (id: string) => id === "DOC-MISSING" ? missingTemplateDocument : id === "DOC-EMPTY" ? noFieldsDocument : document,
    initTemplates: () => Promise.resolve([template, noFieldsTemplate]),
    updateDocumentStatus: vi.fn(),
  },
}));

vi.mock("../components/DocumentPreview", () => ({
  DocumentPreview: () => createElement("div", { "data-testid": "document-preview" }, "Preview"),
}));

vi.mock("../hooks/useEncryptedQr", () => ({
  useEncryptedQr: () => ({ status: "ready", retry: vi.fn() }),
}));

import { DocumentDetail, getDetailFields, getDetailValue } from "./DocumentDetail";

let root: Root;

function renderDetail(id: string) {
  root.render(
    createElement(
      MemoryRouter,
      { initialEntries: [`/documents/${id}`] },
      createElement(Routes, null,
        createElement(Route, { path: "/documents/:id", element: createElement(DocumentDetail) }),
      ),
    ),
  );
}

beforeEach(() => {
  const container = window.document.createElement("div");
  window.document.body.replaceChildren(container);
  root = createRoot(container);
});

afterEach(() => root.unmount());

describe("document detail fields", () => {
  it("derives unique text fields and resolves dynamic and canonical values", () => {
    expect(getDetailFields(template).map((field) => field.label)).toEqual([
      "Recipient Name", "Completion Date", "Department",
    ]);
    expect(getDetailValue(document, "recipient_name")).toBe("Dynamic Recipient");
    expect(getDetailValue(document, "email")).toBe("legacy@example.com");
    expect(getDetailValue(document, "department")).toBe("");
  });

  it("renders template-defined information and preserves actions", async () => {
    renderDetail("DOC-DETAIL");
    await vi.waitFor(() => expect(window.document.body.textContent).toContain("Completion Date"));

    expect(window.document.body.textContent).toContain("Dynamic Recipient");
    expect(window.document.body.textContent).toContain("2026-09-01");
    expect(window.document.body.textContent).toContain("-");
    expect(window.document.body.textContent).toContain("Verification Page");
    expect(window.document.body.textContent).not.toContain("QR On");
    expect(window.document.body.textContent).not.toContain("QR Off");
    expect(window.document.body.textContent).toContain("Download PDF");
    expect(window.document.body.textContent).toContain("Revoke");
    expect(window.document.querySelectorAll('[data-testid="document-preview"]')).toHaveLength(1);
  });

  it("keeps actions and preview available when the template is missing", async () => {
    renderDetail("DOC-MISSING");
    await vi.waitFor(() => expect(window.document.body.textContent).toContain("Template fields are unavailable."));

    expect(window.document.body.textContent).toContain("Verification Page");
    expect(window.document.body.textContent).toContain("Download PDF");
    expect(window.document.body.textContent).toContain("Revoke");
    expect(window.document.querySelectorAll('[data-testid="document-preview"]')).toHaveLength(1);
  });

  it("shows an empty state when the template has no text fields", async () => {
    renderDetail("DOC-EMPTY");
    await vi.waitFor(() => expect(window.document.body.textContent).toContain("This template has no information fields."));

    expect(window.document.body.textContent).toContain("Verification Page");
    expect(window.document.querySelectorAll('[data-testid="document-preview"]')).toHaveLength(1);
  });
});