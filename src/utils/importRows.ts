import type { ImportedRow } from "../types";

export const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 5000;

export function parseImportedRow(
  row: Record<string, unknown>,
  templateKeys: string[],
  seen: Set<string>,
): ImportedRow {
  const value = (key: string) => String(
    row[key] ?? row[key.replaceAll("_", " ")] ??
      (key === "recipient_name" ? row.name : key === "course_name" ? row.course : "") ?? "",
  ).trim();
  const name = value("recipient_name");
  const email = value("email");
  const errors = ["recipient_name", "email"]
    .filter((key) => !value(key))
    .map((key) => `Missing ${key}`);
  templateKeys.filter((key) => !value(key)).forEach((key) => errors.push(`Missing template field ${key}`));
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Invalid email");
  const duplicate = `${email.toLowerCase()}|${name.toLowerCase()}`;
  if (seen.has(duplicate)) errors.push("Duplicate recipient");
  seen.add(duplicate);
  const dynamicData = Object.fromEntries(Object.entries(row).map(([key, item]) => [
    key.trim().toLowerCase(), typeof item === "number" ? item : String(item ?? "").trim(),
  ])) as Record<string, string | number>;
  return { recipient_name: name, email, employee_id: value("employee_id"), department: value("department"), position: value("position"), completion_date: value("completion_date"), certificate_title: value("certificate_title"), course_name: value("course_name"), issue_date: value("issue_date"), organization: value("organization"), certificate_type: value("certificate_type"), isValid: !errors.length, errors, dynamicData };
}