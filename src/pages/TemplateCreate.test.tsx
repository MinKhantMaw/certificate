// @vitest-environment jsdom
import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const storageMock = vi.hoisted(() => ({
  getUser: vi.fn(() => ({ id: "admin" })),
  saveTemplate: vi.fn(async () => undefined),
}));

vi.mock("../services/storage", () => ({ storage: storageMock }));
vi.mock("../components/TemplateBuilder", () => ({
  TemplateBuilder: ({ onChange }: { onChange: (layout: { version: 1; canvas: { width: number; height: number; pageSize: "A4"; orientation: "landscape" }; elements: Array<{ id: string; type: "text"; key: string; x: number; y: number; width: number; height: number; rotation: number }> }) => void }) => {
    useEffect(() => {
      onChange({ version: 1, canvas: { width: 1123, height: 794, pageSize: "A4", orientation: "landscape" }, elements: [{ id: "name", type: "text", key: "recipient_name", x: 0, y: 0, width: 1, height: 1, rotation: 0 }] });
    }, [onChange]);
    return createElement("div", { "data-testid": "template-builder" }, "Canvas editor");
  },
}));

import { TemplateCreate } from "./TemplateCreate";

let root: Root;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(crypto, "randomUUID").mockReturnValue("00000000-0000-4000-8000-000000000003");
  const container = window.document.createElement("div");
  window.document.body.replaceChildren(container);
  root = createRoot(container);
});

afterEach(() => {
  root.unmount();
  vi.restoreAllMocks();
});

describe("TemplateCreate", () => {
  it("creates a template from its dedicated canvas page", async () => {
    await act(async () => {
      root.render(createElement(MemoryRouter, { initialEntries: ["/document-templates/new"] }, createElement(Routes, null,
        createElement(Route, { path: "/document-templates/new", element: createElement(TemplateCreate) }),
        createElement(Route, { path: "/document-templates/:id", element: createElement("div", null, "Template detail") }),
      )));
    });

    await vi.waitFor(() => expect(window.document.querySelector('[data-testid="template-builder"]')).not.toBeNull());
    const nameInput = window.document.querySelector('input[placeholder="Modern Professional"]') as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      setter?.call(nameInput, "New template");
      nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      (window.document.querySelector("form") as HTMLFormElement).dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(storageMock.saveTemplate).toHaveBeenCalledWith(expect.objectContaining({ id: "00000000-0000-4000-8000-000000000003", name: "New template" }));
    await vi.waitFor(() => expect(window.document.body.textContent).toContain("Template detail"));
  });
});