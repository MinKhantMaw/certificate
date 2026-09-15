import { describe, expect, it } from "vitest";
import { MAX_IMPORT_FILE_SIZE, MAX_IMPORT_ROWS, parseImportedRow } from "./importRows";
import { getSampleImportHeaders } from "./sampleImportWorkbook";

describe("direct import row validation", () => {
  it("accepts a valid row that supplies template fields", () => {
    const row = parseImportedRow({ recipient_name: "Alex", email: "alex@example.com", course_name: "Security" }, ["recipient_name", "course_name"]);
    expect(row.isValid).toBe(true);
    expect(row.dynamicData).toMatchObject({ recipient_name: "Alex", course_name: "Security" });
  });

  it("requires only recipient name", () => {
    const row = parseImportedRow({ email: "alex.com" }, ["recipient_name", "course_name", "organization"]);
    expect(row.isValid).toBe(false);
    expect(row.errors).toEqual(["Missing required field recipient_name"]);
  });

  it("accepts only the required field", () => {
    const row = parseImportedRow({ Name: "Alex" }, ["recipient_name", "course_name", "issue_date", "organization"]);
    expect(row.isValid).toBe(true);
    expect(row.course_name).toBe("");
    expect(row.issue_date).toBe("");
    expect(row.dynamicData).toMatchObject({ recipient_name: "Alex" });
  });

  it("accepts a few optional fields with Excel header aliases", () => {
    const row = parseImportedRow({ Name: "Alex", "Course Name": "Security", "Issue Date": "2026-09-15" }, []);
    expect(row.isValid).toBe(true);
    expect(row.course_name).toBe("Security");
    expect(row.issue_date).toBe("2026-09-15");
    expect(row.dynamicData).toMatchObject({ recipient_name: "Alex", course_name: "Security", issue_date: "2026-09-15" });
  });

  it("accepts different combinations of missing optional fields", () => {
    const rows = [
      parseImportedRow({ recipient_name: "Alex", department: "IT" }, ["employee_id", "department", "position"]),
      parseImportedRow({ recipient_name: "Blair", document_title: "Completion" }, ["document_title", "course_name", "organization"]),
      parseImportedRow({ recipient_name: "Casey", organization: "KBZ", document_type: "completion" }, ["issue_date", "document_type"]),
    ];
    expect(rows.every((row) => row.isValid && row.errors.length === 0)).toBe(true);
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