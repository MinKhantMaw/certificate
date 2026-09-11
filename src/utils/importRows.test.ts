import { describe, expect, it } from "vitest";
import { MAX_IMPORT_FILE_SIZE, MAX_IMPORT_ROWS, parseImportedRow } from "./importRows";
import { getSampleImportHeaders } from "./sampleImportWorkbook";

describe("direct import row validation", () => {
  it("accepts a valid row that supplies template fields", () => {
    const row = parseImportedRow({ recipient_name: "Alex", email: "alex@example.com", course_name: "Security" }, ["recipient_name", "course_name"]);
    expect(row.isValid).toBe(true);
    expect(row.dynamicData).toMatchObject({ recipient_name: "Alex", course_name: "Security" });
  });

  it("reports only fields required by the selected template", () => {
    const invalid = parseImportedRow({ recipient_name: "Alex", email: "invalid" }, ["course_name"]);
    expect(invalid.errors).toEqual(["Missing template field course_name"]);
  });

  it("accepts a template row without recipient name or email fields", () => {
    const row = parseImportedRow({ course_name: "Security" }, ["course_name"]);
    expect(row.isValid).toBe(true);
  });

  it("defines the supported file and row limits", () => {
    expect(MAX_IMPORT_FILE_SIZE).toBe(10 * 1024 * 1024);
    expect(MAX_IMPORT_ROWS).toBe(5000);
  });

  it("accepts a completed row when its template sample includes required fields", () => {
    const headers = getSampleImportHeaders({
      version: 1,
      canvas: { width: 1, height: 1, pageSize: "A4", orientation: "landscape" },
      elements: [
        { id: "name", type: "text", key: "recipient_name", x: 0, y: 0, width: 1, height: 1, rotation: 0 },
        { id: "email", type: "text", key: "email", x: 0, y: 0, width: 1, height: 1, rotation: 0 },
        { id: "course", type: "text", key: "course_name", x: 0, y: 0, width: 1, height: 1, rotation: 0 },
      ],
    });
    const row = Object.fromEntries(headers.map((header) => [
      header,
      header === "email" ? "alex@example.com" : "Alex",
    ]));

    expect(parseImportedRow(row, headers).isValid).toBe(true);
  });
});