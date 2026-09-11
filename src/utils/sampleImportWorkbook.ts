import * as XLSX from "xlsx";
import type { TemplateLayout } from "../types";
import { getTemplateKeys } from "./index";

export function getSampleImportHeaders(layout?: TemplateLayout): string[] {
  return getTemplateKeys(layout);
}

export function createSampleImportWorkbook(layout?: TemplateLayout): XLSX.WorkBook {
  const worksheet = XLSX.utils.aoa_to_sheet([getSampleImportHeaders(layout)]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Documents");
  return workbook;
}

export function getSampleImportFilename(templateName: string): string {
  const safeName = templateName
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `${safeName || "template"}-sample-import.xlsx`;
}

export function downloadSampleImportWorkbook(
  templateName: string,
  layout?: TemplateLayout,
) {
  XLSX.writeFile(createSampleImportWorkbook(layout), getSampleImportFilename(templateName));
}