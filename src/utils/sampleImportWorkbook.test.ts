import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import type { TemplateLayout } from "../types";
import {
  createSampleImportWorkbook,
  getSampleImportFilename,
  getSampleImportHeaders,
} from "./sampleImportWorkbook";

function layoutWithKeys(keys: string[]): TemplateLayout {
  return {
    version: 1,
    canvas: { width: 1, height: 1, pageSize: "A4", orientation: "landscape" },
    elements: keys.map((key, index) => ({
      id: String(index),
      type: "text",
      key,
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      rotation: 0,
    })),
  };
}

describe("sample import workbooks", () => {
  it("uses only distinct fields configured by the template", () => {
    expect(getSampleImportHeaders(layoutWithKeys([
      "{{course_name}}", "email", "recipient_name", "course_name",
    ]))).toEqual(["course_name", "email", "recipient_name"]);
  });

  it("creates a header-only workbook for templates without fields", () => {
    const workbook = createSampleImportWorkbook();
    expect(workbook.SheetNames).toEqual(["Documents"]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Documents, { header: 1 }))
      .toEqual([]);
  });

  it("sanitizes template names for download filenames", () => {
    expect(getSampleImportFilename("  Sales / 2026  "))
      .toBe("sales-2026-sample-import.xlsx");
    expect(getSampleImportFilename("***")).toBe("template-sample-import.xlsx");
  });
});