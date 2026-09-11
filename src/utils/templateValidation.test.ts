import { describe, expect, it } from "vitest";
import { createDefaultLayout } from "./templateLayout";
import { validateTemplate } from "./templateValidation";

describe("template validation", () => {
  it("rejects missing names and invalid layouts", () => {
    expect(validateTemplate("", createDefaultLayout())).toBe("Template name is required.");
    expect(validateTemplate("Template", createDefaultLayout())).toBe("Add at least one element to the template.");
  });

  it("accepts a template layout with a valid placeholder", () => {
    const layout = createDefaultLayout();
    layout.elements.push({ id: "recipient", type: "text", key: "recipient_name", x: 0, y: 0, width: 100, height: 24, rotation: 0 });
    expect(validateTemplate("Template", layout)).toBeUndefined();
  });
});