import { describe, expect, it } from "vitest";
import { MAX_IMPORT_FILE_SIZE, MAX_IMPORT_ROWS, parseImportedRow } from "./importRows";

describe("direct import row validation", () => {
  it("accepts a valid row that supplies template fields", () => {
    const row = parseImportedRow({ recipient_name: "Alex", email: "alex@example.com", course_name: "Security" }, ["recipient_name", "course_name"], new Set());
    expect(row.isValid).toBe(true);
    expect(row.dynamicData).toMatchObject({ recipient_name: "Alex", course_name: "Security" });
  });

  it("reports invalid email, missing template data, and duplicate recipients", () => {
    const seen = new Set<string>();
    const invalid = parseImportedRow({ recipient_name: "Alex", email: "invalid" }, ["course_name"], seen);
    const duplicate = parseImportedRow({ recipient_name: "Alex", email: "invalid" }, [], seen);
    expect(invalid.errors).toEqual(expect.arrayContaining(["Missing template field course_name", "Invalid email"]));
    expect(duplicate.errors).toContain("Duplicate recipient");
  });

  it("defines the supported file and row limits", () => {
    expect(MAX_IMPORT_FILE_SIZE).toBe(10 * 1024 * 1024);
    expect(MAX_IMPORT_ROWS).toBe(5000);
  });
});