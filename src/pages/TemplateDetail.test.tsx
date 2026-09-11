// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentTemplate } from "../types";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { downloadSampleImportWorkbookMock, templates, storageMock } = vi.hoisted(() => {
  const templates: DocumentTemplate[] = [
    {
      id: "used",
      name: "Used template",
      description: "Used for issued documents.",
      design: "konva",
      status: "ACTIVE",
      createdBy: "admin",
      createdAt: "",
      updatedAt: "",
      layout: { version: 1, canvas: { width: 100, height: 100, pageSize: "A4", orientation: "landscape" }, elements: [{ id: "name", type: "text", key: "recipient_name", x: 0, y: 0, width: 1, height: 1, rotation: 0 }] },
    },
    { id: "unused", name: "Unused template", description: "", design: "konva", status: "INACTIVE", createdBy: "admin", createdAt: "", updatedAt: "" },
  ];
  return {
    downloadSampleImportWorkbookMock: vi.fn(),
    templates,
    storageMock: {
      initTemplates: vi.fn(async () => templates),
      updateTemplate: vi.fn(async () => undefined),
      deleteTemplate: vi.fn(async (id: string) => {
        if (id === "used") throw new Error("Cannot delete a template used by existing documents.");
        const index = templates.findIndex((template) => template.id === id);
        if (index >= 0) templates.splice(index, 1);
      }),
    },
  };
});

vi.mock("../services/storage", () => ({ storage: storageMock }));
vi.mock("../utils/sampleImportWorkbook", () => ({ downloadSampleImportWorkbook: downloadSampleImportWorkbookMock }));
vi.mock("../components/TemplateBuilder", () => ({
  TemplateBuilder: () => createElement("div", { "data-testid": "template-builder" }, "Canvas editor"),
}));

import { TemplateDetail } from "./TemplateDetail";

let root: Root;

function renderDetail(id: string) {
  act(() => {
    root.render(createElement(MemoryRouter, { key: id, initialEntries: [`/document-templates/${id}`] }, createElement(Routes, null,
      createElement(Route, { path: "/document-templates", element: createElement("div", null, "Templates list") }),
      createElement(Route, { path: "/document-templates/:id", element: createElement(TemplateDetail) }),
    )));
  });
}

beforeEach(() => {
  templates.splice(0, templates.length,
    { id: "used", name: "Used template", description: "Used for issued documents.", design: "konva", status: "ACTIVE", createdBy: "admin", createdAt: "", updatedAt: "", layout: { version: 1, canvas: { width: 100, height: 100, pageSize: "A4", orientation: "landscape" }, elements: [{ id: "name", type: "text", key: "recipient_name", x: 0, y: 0, width: 1, height: 1, rotation: 0 }] } },
    { id: "unused", name: "Unused template", description: "", design: "konva", status: "INACTIVE", createdBy: "admin", createdAt: "", updatedAt: "" },
  );
  vi.clearAllMocks();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const container = window.document.createElement("div");
  window.document.body.replaceChildren(container);
  root = createRoot(container);
});

afterEach(() => {
  root.unmount();
  vi.restoreAllMocks();
});

describe("TemplateDetail", () => {
  it("shows configured template details and management controls", async () => {
    renderDetail("used");
    await vi.waitFor(() => expect(window.document.body.textContent).toContain("Used for issued documents."));

    expect(window.document.body.textContent).toContain("Recipient Name");
    await vi.waitFor(() => expect(window.document.querySelector('[data-testid="template-builder"]')).not.toBeNull());
    await act(async () => (window.document.querySelector("button") as HTMLButtonElement).click());
    expect(downloadSampleImportWorkbookMock).toHaveBeenCalledWith("Used template", templates[0].layout);
  });

  it("shows an empty fields state and a not-found state", async () => {
    renderDetail("unused");
    await vi.waitFor(() => expect(window.document.body.textContent).toContain("No dynamic fields are configured."));

    renderDetail("missing");
    await vi.waitFor(() => expect(window.document.body.textContent).toContain("Template not found."));
  });

  it("keeps referenced templates and deletes unreferenced templates", async () => {
    renderDetail("used");
    await vi.waitFor(() => expect(window.document.body.textContent).toContain("Used template"));
    const buttons = window.document.querySelectorAll("button");
    await act(async () => (buttons[1] as HTMLButtonElement).click());
    expect(window.document.body.textContent).toContain("Cannot delete a template used by existing documents.");

    renderDetail("unused");
    await vi.waitFor(() => expect(window.document.body.textContent).toContain("Unused template"));
    await act(async () => (window.document.querySelectorAll("button")[1] as HTMLButtonElement).click());
    await vi.waitFor(() => expect(window.document.body.textContent).toContain("Templates list"));
  });

  it("saves validated detail-page edits", async () => {
    renderDetail("used");
    await vi.waitFor(() => expect(window.document.body.textContent).toContain("Save changes"));
    const nameInput = window.document.querySelectorAll("input")[0] as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(nameInput, "Renamed template");
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      (window.document.querySelector("form") as HTMLFormElement).dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(storageMock.updateTemplate).toHaveBeenCalledWith(expect.objectContaining({ id: "used", name: "Renamed template" }));
    expect(window.document.body.textContent).toContain("Renamed template");
  });
});