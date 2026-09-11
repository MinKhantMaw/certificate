// @vitest-environment jsdom
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let root: Root;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("cms_auth", JSON.stringify({ id: "admin", email: "admin@example.com", name: "Admin", role: "ADMIN" }));
  const container = window.document.createElement("div");
  window.document.body.replaceChildren(container);
  root = createRoot(container);
});

afterEach(() => {
  root.unmount();
  vi.resetModules();
});

async function renderAt(path: string, assertion: () => void) {
  window.history.pushState({}, "", path);
  const { default: App } = await import("./App");
  root.render(<App />);
  await vi.waitFor(assertion);
}

describe("document routes", () => {
  it("renders the document list and rejects the retired certificate path", async () => {
    await renderAt("/documents", () => expect(window.document.body.textContent).toContain("Documents"));

    root.unmount();
    const replacement = window.document.createElement("div");
    window.document.body.replaceChildren(replacement);
    root = createRoot(replacement);
    await renderAt("/certificates", () => expect(window.location.pathname).toBe("/dashboard"));
  });
});