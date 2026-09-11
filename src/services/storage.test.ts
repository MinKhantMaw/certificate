// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentTemplate, ImportedRow } from "../types";

const template = (): DocumentTemplate => ({
  id: "template-1", name: "Original", description: "Test template", design: "konva",
  status: "ACTIVE", createdBy: "admin", createdAt: "2026-01-01", updatedAt: "2026-01-01",
});

const row = (overrides: Partial<ImportedRow> = {}): ImportedRow => ({
  recipient_name: "Alex Smith", email: "alex@example.com", document_title: "Completion",
  course_name: "Security", issue_date: "2026-01-01", organization: "KBZ", document_type: "completion",
  isValid: true, errors: [], dynamicData: {}, ...overrides,
});

async function loadStorage() {
  vi.resetModules();
  return (await import("./storage")).storage;
}

beforeEach(() => localStorage.clear());

describe("document template CRUD", () => {
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

  it("protects templates referenced by documents in any status", async () => {
    const storage = await loadStorage();
    await storage.initTemplates();
    await storage.saveTemplate(template());
    const documents = storage.generateDocuments(
      [
        row({ recipient_name: "Valid", email: "valid@example.com" }),
        row({ recipient_name: "Revoked", email: "revoked@example.com" }),
        row({ recipient_name: "Pending", email: "pending@example.com" }),
        row({ recipient_name: "Rejected", email: "rejected@example.com" }),
      ],
      "template-1",
    );
    storage.updateDocumentStatus(documents[1].id, "REVOKED");
    storage.updateDocumentStatus(documents[2].id, "PENDING_APPROVAL");
    storage.updateDocumentStatus(documents[3].id, "REJECTED");

    await expect(storage.deleteTemplate("template-1")).rejects.toThrow(
      "Cannot delete a template used by existing documents.",
    );

    expect(storage.getTemplates()).toHaveLength(1);
    expect(storage.getDocuments().map((document) => document.documentTemplateId)).toEqual([
      "template-1",
      "template-1",
      "template-1",
      "template-1",
    ]);
  });
});

describe("direct document generation", () => {
  it("creates verified documents from valid uploaded rows without program data", async () => {
    const storage = await loadStorage();
    await storage.initTemplates();
    await storage.saveTemplate(template());
    const documents = storage.generateDocuments([row(), row({ recipient_name: "Jamie Doe", email: "jamie@example.com" })], "template-1");

    expect(documents).toHaveLength(2);
    expect(new Set(documents.map((document) => document.shortId)).size).toBe(2);
    expect(documents.every((document) => document.status === "VALID" && document.verificationUrl.includes("/verify/"))).toBe(true);
    expect(documents.every((document) => !("trainingProgramId" in document))).toBe(true);
  });

  it("rejects generation when any uploaded row is invalid", async () => {
    const storage = await loadStorage();
    await storage.initTemplates();
    await storage.saveTemplate(template());
    expect(() => storage.generateDocuments([row({ isValid: false, errors: ["Invalid email"] })], "template-1"))
      .toThrow("All imported rows must be valid before generation.");
  });

  it("migrates legacy certificate storage to document storage", async () => {
    localStorage.setItem("cms_trainings", JSON.stringify([{ id: "legacy-program" }]));
    localStorage.setItem("cms_trainees", JSON.stringify([{ id: "legacy-trainee" }]));
    localStorage.setItem("cms_certificates", JSON.stringify([{ ...row(), id: "legacy", certificateNumber: "CERT-legacy", certificateTitle: "Certificate of Completion", certificateType: "completion", certificateTemplateId: "template-1", verificationToken: "token", verificationUrl: "/verify/token", status: "VALID", createdAt: "2026-01-01", trainingProgramId: "legacy-program" }]));
    const storage = await loadStorage();
    storage.initDemoData();

    expect(localStorage.getItem("cms_trainings")).toBeNull();
    expect(localStorage.getItem("cms_trainees")).toBeNull();
    expect(localStorage.getItem("cms_certificates")).toBeNull();
    expect(storage.getDocuments()[0]).toMatchObject({ documentNumber: "CERT-legacy", documentTitle: "Certificate of Completion", documentTemplateId: "template-1" });
  });
});