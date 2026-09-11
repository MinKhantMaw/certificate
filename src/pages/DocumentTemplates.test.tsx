// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { downloadSampleImportWorkbookMock, templates, storageMock } = vi.hoisted(() => {
  const templates = [
    { id: "used", name: "Used template", description: "", design: "konva", status: "ACTIVE", createdBy: "admin", createdAt: "", updatedAt: "" },
    { id: "unused", name: "Unused template", description: "", design: "konva", status: "ACTIVE", createdBy: "admin", createdAt: "", updatedAt: "" },
  ];
  return {
    downloadSampleImportWorkbookMock: vi.fn(),
    templates,
    storageMock: {
      getTemplates: vi.fn(() => templates),
      initTemplates: vi.fn(async () => templates),
      deleteTemplate: vi.fn(async (id: string) => {
        if (id === "used") throw new Error("Cannot delete a template used by existing documents.");
        const index = templates.findIndex((template) => template.id === id);
        if (index >= 0) templates.splice(index, 1);
      }),
      getUser: vi.fn(() => ({ id: "admin" })),
    },
  };
});

vi.mock("../services/storage", () => ({ storage: storageMock }));
vi.mock("../utils/sampleImportWorkbook", () => ({
  downloadSampleImportWorkbook: downloadSampleImportWorkbookMock,
}));

import { DocumentTemplates } from "./DocumentTemplates";

let root: Root;

beforeEach(async () => {
  templates.splice(0, templates.length,
    { id: "used", name: "Used template", description: "", design: "konva", status: "ACTIVE", createdBy: "admin", createdAt: "", updatedAt: "" },
    { id: "unused", name: "Unused template", description: "", design: "konva", status: "ACTIVE", createdBy: "admin", createdAt: "", updatedAt: "" },
  );
  vi.clearAllMocks();
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const container = window.document.createElement("div");
  window.document.body.replaceChildren(container);
  root = createRoot(container);
  await act(async () => {
    root.render(createElement(DocumentTemplates));
    await Promise.resolve();
  });
});

afterEach(() => {
  act(() => root.unmount());
  vi.restoreAllMocks();
});

describe("DocumentTemplates", () => {
  it("keeps a referenced template and shows the deletion error", async () => {
    await vi.waitFor(() => expect(window.document.body.textContent).toContain("Used template"));

    await act(async () => {
      (window.document.querySelector('[aria-label="Delete Used template"]') as HTMLButtonElement).click();
    });

    expect(window.document.body.textContent).toContain("Used template");
    expect(window.document.body.textContent).toContain("Cannot delete a template used by existing documents.");
  });

  it("removes an unused template after deletion succeeds", async () => {
    await vi.waitFor(() => expect(window.document.body.textContent).toContain("Unused template"));

    await act(async () => {
      (window.document.querySelector('[aria-label="Delete Unused template"]') as HTMLButtonElement).click();
    });

    expect(window.document.body.textContent).not.toContain("Unused template");
    expect(window.document.body.textContent).toContain("Used template");
  });

  it("downloads a sample Excel file for the selected template", async () => {
    await vi.waitFor(() => expect(window.document.body.textContent).toContain("Used template"));

    await act(async () => {
      (window.document.querySelector('[aria-label="Download sample Excel for Used template"]') as HTMLButtonElement).click();
    });

    expect(downloadSampleImportWorkbookMock).toHaveBeenCalledWith("Used template", undefined);
  });
});