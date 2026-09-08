import { TemplateLayout } from "../types";

export function createDefaultLayout(): TemplateLayout {
  return {
    version: 1,
    canvas: {
      width: 1123,
      height: 794,
      pageSize: "A4",
      orientation: "landscape",
    },
    elements: [],
  };
}