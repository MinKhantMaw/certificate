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
  it("renders the public landing page without authentication", async () => {
    localStorage.removeItem("cms_auth");

    await renderAt("/", () =>
      expect(window.document.body.textContent).toContain(
        "Design once,  use indefinitely",
      ),
    );

    expect(window.document.body.textContent).toContain("Reusable templates");
    expect(window.document.body.textContent).toContain(
      "Spreadsheet generation",
    );
    expect(window.document.body.textContent).toContain(
      "Approval and signatures",
    );
    expect(window.document.body.textContent).toContain("Instant verification");
    expect(window.document.querySelector('a[href="/login"]')).not.toBeNull();
  });

  it("keeps verification public and protects the admin dashboard", async () => {
    localStorage.removeItem("cms_auth");

    await renderAt("/verify/example-document", () =>
      expect(window.document.body.textContent).toContain("Document Not Found"),
    );

    root.unmount();
    const replacement = window.document.createElement("div");
    window.document.body.replaceChildren(replacement);
    root = createRoot(replacement);
    await renderAt("/dashboard", () =>
      expect(window.location.pathname).toBe("/login"),
    );
  });

  it("renders the document list and rejects the retired certificate path", async () => {
    await renderAt("/documents", () => expect(window.document.body.textContent).toContain("Documents"));

    root.unmount();
    const replacement = window.document.createElement("div");
    window.document.body.replaceChildren(replacement);
    root = createRoot(replacement);
    await renderAt("/certificates", () => expect(window.location.pathname).toBe("/dashboard"));
  });

  it("renders a template detail route", async () => {
    await renderAt("/document-templates/template-id", () => expect(window.document.body.textContent).toContain("Template not found."));
  });

  it("renders the template creation route", async () => {
    vi.doMock("./components/TemplateBuilder", () => ({
      TemplateBuilder: () => <div>Canvas editor</div>,
    }));
    await renderAt("/document-templates/new", () => expect(window.document.body.textContent).toContain("New template"));
  });
});