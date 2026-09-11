import type { TemplateLayout } from "../types";
import { getTemplateKeys } from "./index";

export function validateTemplate(name: string, layout: TemplateLayout): string | undefined {
  if (!name.trim()) return "Template name is required.";
  if (layout.elements.some((element) => element.type === "text" && !element.key?.trim())) return "Every text element needs a placeholder key.";
  if (layout.elements.some((element) => element.type === "signature" && !element.signatureId)) return "Every signature element must reference a signature.";
  if (new Set(layout.elements.map((element) => element.id)).size !== layout.elements.length || layout.canvas.width < 100 || layout.canvas.height < 100) return "The template layout is invalid.";
  if (!getTemplateKeys(layout).length && !layout.elements.length) return "Add at least one element to the template.";
  return undefined;
}