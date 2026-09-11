// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CertificateTemplate, ImportedRow } from "../types";

const template = (): CertificateTemplate => ({
  id: "template-1", name: "Original", description: "Test template", design: "konva",
  status: "ACTIVE", createdBy: "admin", createdAt: "2026-01-01", updatedAt: "2026-01-01",
});

const row = (overrides: Partial<ImportedRow> = {}): ImportedRow => ({
  recipient_name: "Alex Smith", email: "alex@example.com", certificate_title: "Completion",
  course_name: "Security", issue_date: "2026-01-01", organization: "KBZ", certificate_type: "completion",
  isValid: true, errors: [], dynamicData: {}, ...overrides,
});

async function loadStorage() {
  vi.resetModules();
  return (await import("./storage")).storage;
}

beforeEach(() => localStorage.clear());

describe("certificate template CRUD", () => {
  it("creates, updates, and deletes a persisted template", async () => {
    const storage = await loadStorage();
    await storage.initTemplates();
    await storage.saveTemplate(template());
    expect(storage.getTemplates()).toMatchObject([{ id: "template-1", name: "Original" }]);

    await storage.updateTemplate({ ...template(), name: "Updated" });
    expect(storage.getTemplates()[0].name).toBe("Updated");

    await storage.deleteTemplate("template-1");
    expect(storage.getTemplates()).toEqual([]);
    expect(JSON.parse(localStorage.getItem("cms_templates") || "[]")).toEqual([]);
  });
});

describe("direct certificate generation", () => {
  it("creates verified certificates from valid uploaded rows without program data", async () => {
    const storage = await loadStorage();
    await storage.initTemplates();
    await storage.saveTemplate(template());
    const certificates = storage.generateCertificates([row(), row({ recipient_name: "Jamie Doe", email: "jamie@example.com" })], "template-1");

    expect(certificates).toHaveLength(2);
    expect(new Set(certificates.map((certificate) => certificate.shortId)).size).toBe(2);
    expect(certificates.every((certificate) => certificate.status === "VALID" && certificate.verificationUrl.includes("/verify/"))).toBe(true);
    expect(certificates.every((certificate) => !("trainingProgramId" in certificate))).toBe(true);
  });

  it("rejects generation when any uploaded row is invalid", async () => {
    const storage = await loadStorage();
    await storage.initTemplates();
    await storage.saveTemplate(template());
    expect(() => storage.generateCertificates([row({ isValid: false, errors: ["Invalid email"] })], "template-1"))
      .toThrow("All imported rows must be valid before generation.");
  });

  it("removes retired training records and relationships from existing data", async () => {
    localStorage.setItem("cms_trainings", JSON.stringify([{ id: "legacy-program" }]));
    localStorage.setItem("cms_trainees", JSON.stringify([{ id: "legacy-trainee" }]));
    localStorage.setItem("cms_certificates", JSON.stringify([{ ...row(), id: "legacy", certificateNumber: "legacy", verificationToken: "token", verificationUrl: "/verify/token", status: "VALID", createdAt: "2026-01-01", trainingProgramId: "legacy-program" }]));
    const storage = await loadStorage();
    storage.initDemoData();

    expect(localStorage.getItem("cms_trainings")).toBeNull();
    expect(localStorage.getItem("cms_trainees")).toBeNull();
    expect(storage.getCertificates()[0]).not.toHaveProperty("trainingProgramId");
  });
});