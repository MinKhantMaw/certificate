// @vitest-environment jsdom
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Document, DocumentTemplate } from "../types";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const document: Document = {
  id: "DOC-PREVIEW",
  documentNumber: "DOC-PREVIEW",
  verificationToken: "preview-token",
  verificationUrl: "/verify/preview-token",
  recipientName: "Preview Recipient",
  documentTitle: "Completion",
  courseName: "Course",
  issueDate: "2026-01-01",
  organization: "KBZ BANK",
  documentType: "completion",
  email: "preview@example.com",
  status: "VALID",
  documentTemplateId: "template-qr",
  createdAt: "2026-01-01",
};

const templates: DocumentTemplate[] = [
  {
    id: "template-qr",
    name: "With QR",
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
        { id: "name", type: "text", key: "recipient_name", x: 0, y: 0, width: 50, height: 10, rotation: 0 },
        { id: "qr", type: "qr", x: 10, y: 20, width: 20, height: 20, rotation: 0 },
      ],
    },
  },
  {
    id: "template-without-qr",
    name: "Without QR",
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
        { id: "name", type: "text", key: "recipient_name", x: 0, y: 0, width: 50, height: 10, rotation: 0 },
      ],
    },
  },
];

vi.mock("../services/storage", () => ({
  storage: {
    getTemplates: () => templates,
    initTemplates: () => Promise.resolve(templates),
    getUsers: () => [],
  },
}));

vi.mock("../hooks/useEncryptedQr", () => ({
  useEncryptedQr: () => ({ url: "/verify/preview-token", status: "ready", retry: vi.fn() }),
}));

vi.mock("qrcode.react", () => ({
  QRCodeSVG: () => createElement("svg", { "data-testid": "qr-code" }),
}));

import { DocumentPreview } from "./DocumentPreview";

let root: Root;

function renderPreview(templateId: string) {
  root.render(
    createElement(DocumentPreview, {
      document: { ...document, documentTemplateId: templateId },
    }),
  );
}

beforeEach(() => {
  const container = window.document.createElement("div");
  window.document.body.replaceChildren(container);
  root = createRoot(container);
});

afterEach(() => root.unmount());

describe("DocumentPreview QR rendering", () => {
  it("renders a QR element at the configured position", async () => {
    renderPreview("template-qr");
    await vi.waitFor(() => expect(window.document.querySelector("[data-testid=qr-code]")).not.toBeNull());

    const qrContainer = window.document.querySelector("[data-testid=qr-code]")?.parentElement?.parentElement;
    expect(qrContainer?.style.left).toBe("10%");
    expect(qrContainer?.style.top).toBe("20%");
  });

  it("does not render a QR when the template has no QR element", async () => {
    renderPreview("template-without-qr");
    await vi.waitFor(() => expect(window.document.body.textContent).toContain("Preview Recipient"));

    expect(window.document.querySelector("[data-testid=qr-code]")).toBeNull();
  });
});