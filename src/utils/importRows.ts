import type { ImportedRow } from "../types";

export const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 5000;

export function parseImportedRow(
  row: Record<string, unknown>,
  _templateKeys: string[],
): ImportedRow {
  const normalizeHeader = (key: string) => key.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const source = new Map(Object.entries(row).map(([key, value]) => [normalizeHeader(key), value]));
  const aliases: Record<string, string[]> = {
    recipient_name: ["recipient_name", "name"],
    email: ["email", "email_address"],
    course_name: ["course_name", "course"],
  };
  const rawValue = (key: string): unknown => {
    const candidates = aliases[key] || [key];
    for (const candidate of candidates) {
      const value = source.get(normalizeHeader(candidate));
      if (value !== undefined && value !== null) return value;
    }
    return "";
  };
  const value = (key: string) => String(rawValue(key)).trim();
  const recipientName = value("recipient_name");
  const errors = recipientName ? [] : ["Missing required field recipient_name"];
  const dynamicData = Object.fromEntries(Object.entries(row).map(([key, item]) => [
    normalizeHeader(key), typeof item === "number" ? item : String(item ?? "").trim(),
  ])) as Record<string, string | number>;

  for (const key of ["recipient_name", "email", "employee_id", "department", "position", "completion_date", "document_title", "course_name", "issue_date", "organization", "document_type"]) {
    const item = rawValue(key);
    if (item !== "" && item !== null && item !== undefined) {
      dynamicData[key] = typeof item === "number" ? item : String(item).trim();
    }
  }

  return {
    recipient_name: recipientName,
    email: value("email"),
    employee_id: value("employee_id"),
    department: value("department"),
    position: value("position"),
    completion_date: value("completion_date"),
    document_title: value("document_title"),
    course_name: value("course_name"),
    issue_date: value("issue_date"),
    organization: value("organization"),
    document_type: value("document_type"),
    isValid: errors.length === 0,
    errors,
    dynamicData,
  };
}
