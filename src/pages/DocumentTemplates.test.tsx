// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { templates, storageMock } = vi.hoisted(() => {
  const templates = [
    { id: "used", name: "Used template", description: "", design: "konva", status: "ACTIVE", createdBy: "admin", createdAt: "", updatedAt: "" },
    { id: "unused", name: "Unused template", description: "", design: "konva", status: "ACTIVE", createdBy: "admin", createdAt: "", updatedAt: "" },
  ];
  return {
    templates,
    storageMock: {
      getTemplates: vi.fn(() => templates),
      initTemplates: vi.fn(async () => templates),
      getUser: vi.fn(() => ({ id: "admin" })),
    },
  };
});

vi.mock("../services/storage", () => ({ storage: storageMock }));
import { DocumentTemplates } from "./DocumentTemplates";

let root: Root;

async function renderTemplates() {
  await act(async () => {
    root.render(createElement(MemoryRouter, null, createElement(DocumentTemplates)));
    await Promise.resolve();
  });
}

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
  await renderTemplates();
});

afterEach(() => {
  act(() => root.unmount());
  vi.restoreAllMocks();
});

describe("DocumentTemplates", () => {
  it("links template summaries to their detail pages", async () => {
    await vi.waitFor(() => expect(window.document.body.textContent).toContain("Used template"));

    expect((window.document.querySelector('a[href="/document-templates/used"]') as HTMLAnchorElement).textContent).toBe("View details");
    expect((window.document.querySelector('a[href="/document-templates/new"]') as HTMLAnchorElement).textContent).toContain("New template");
    expect(window.document.querySelector('[aria-label="Download sample Excel for Used template"]')).toBeNull();
    expect(window.document.querySelector('[aria-label="Edit Used template"]')).toBeNull();
    expect(window.document.querySelector('[aria-label="Delete Used template"]')).toBeNull();
  });

});