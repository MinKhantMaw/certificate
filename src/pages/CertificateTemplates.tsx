import { FormEvent, lazy, Suspense, useEffect, useState } from "react";
import {
  Edit3,
  Palette,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { storage } from "../services/storage";
import { CertificateTemplate, TemplateLayout } from "../types";
import { getTemplateKeys } from "../utils";
import { createDefaultLayout } from "../utils/templateLayout";

const TemplateBuilder = lazy(() =>
  import("../components/TemplateBuilder").then(({ TemplateBuilder }) => ({
    default: TemplateBuilder,
  })),
);

export function CertificateTemplates() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [previewImage, setPreviewImage] = useState<string | undefined>();
  const [layout, setLayout] = useState<TemplateLayout>(createDefaultLayout);
  const [error, setError] = useState("");
  useEffect(() => {
    storage
      .initTemplates()
      .then(setTemplates)
      .catch((reason: Error) => setError(reason.message));
  }, []);
  const resetForm = () => {
    setName("");
    setDescription("");
    setPreviewImage(undefined);
    setEditingId(null);
    setLayout(createDefaultLayout());
    setError("");
    setShowForm(false);
  };
  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };
  const openEdit = (template: CertificateTemplate) => {
    setEditingId(template.id);
    setName(template.name);
    setDescription(template.description);
    setPreviewImage(template.previewImage);
    setLayout(template.layout || createDefaultLayout());
    setError("");
    setShowForm(true);
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    const keys = getTemplateKeys(layout);
    const invalidText = layout.elements.some(
      (element) => element.type === "text" && !element.key?.trim(),
    );
    const invalidSignature = layout.elements.some(
      (element) => element.type === "signature" && !element.signatureId,
    );
    const duplicateIds =
      new Set(layout.elements.map((element) => element.id)).size !==
      layout.elements.length;
    if (!name.trim()) return setError("Template name is required.");
    if (invalidText)
      return setError("Every text element needs a placeholder key.");
    if (invalidSignature)
      return setError("Every signature element must reference a signature.");
    if (duplicateIds || layout.canvas.width < 100 || layout.canvas.height < 100)
      return setError("The template layout is invalid.");
    if (!keys.length && !layout.elements.length)
      return setError("Add at least one element to the template.");
    setError("");
    const timestamp = new Date().toISOString();
    if (editingId) {
      const existing = templates.find((item) => item.id === editingId);
      if (!existing) return;
      await storage.updateTemplate({
        ...existing,
        name: name.trim(),
        description: description.trim(),
        previewImage: layout.background || previewImage,
        layout,
        updatedAt: timestamp,
      });
    } else {
      await storage.saveTemplate({
        id: crypto.randomUUID(),
        name: name.trim(),
        description: description.trim(),
        previewImage: layout.background || previewImage,
        layout,
        design: "konva",
        status: "ACTIVE",
        createdBy: storage.getUser()?.id || "u-admin",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
    setTemplates([...storage.getTemplates()]);
    resetForm();
  };
  const toggle = async (template: CertificateTemplate) => {
    await storage.updateTemplate({
      ...template,
      status: template.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      updatedAt: new Date().toISOString(),
    });
    setTemplates([...storage.getTemplates()]);
  };
  const remove = async (template: CertificateTemplate) => {
    if (
      storage
        .getTrainings()
        .some((program) => program.certificateTemplateId === template.id)
    ) {
      window.alert(
        "This template is assigned to a training program and cannot be deleted.",
      );
      return;
    }
    if (!window.confirm(`Delete the template "${template.name}"?`)) return;
    await storage.deleteTemplate(template.id);
    setTemplates([...storage.getTemplates()]);
  };
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600">
            Design library
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">
            Certificate templates
          </h2>
          <p className="mt-2 text-slate-500">
            Choose the visual system that every achievement inherits.
          </p>
        </div>
        <button
          onClick={showForm ? resetForm : openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"
        >
          {showForm ? <X size={17} /> : <Plus size={17} />}
          {showForm ? "Cancel" : "New template"}
        </button>
      </div>
      {showForm && (
        <form
          onSubmit={save}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Template name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Modern Professional"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Description
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Short description"
              />
            </label>
          </div>
          <Suspense
            fallback={
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                Loading template editor...
              </div>
            }
          >
            <TemplateBuilder
              key={editingId || "draft"}
              template={{
                id: editingId || "draft",
                name,
                description,
                design: "konva",
                status: "ACTIVE",
                createdBy: storage.getUser()?.id || "u-admin",
                createdAt: "",
                updatedAt: "",
                previewImage,
                layout,
              }}
              onChange={setLayout}
            />
          </Suspense>
          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            {editingId ? "Save changes" : "Create template"}
          </button>
        </form>
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="relative flex aspect-[1.45] items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-teal-900 to-amber-200 p-5">
              {template.previewImage && (
                <img
                  src={template.previewImage}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover opacity-30"
                />
              )}
              <div className="flex h-full w-full flex-col items-center justify-center border border-white/50 text-center text-white">
                <Palette size={20} />
                <p className="mt-3 text-xs uppercase tracking-[0.25em]">
                  Certificate
                </p>
                <p className="mt-1 font-serif text-2xl">{template.name}</p>
                <p className="mt-2 text-xs text-white/70">
                  {"{{organizationName}}"} · {"{{recipientName}}"}
                </p>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-950">
                    {template.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {template.description}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold ${template.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                >
                  {template.status}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                <span className="text-slate-400">Dynamic fields supported</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openEdit(template)}
                    className="text-slate-500"
                    aria-label={`Edit ${template.name}`}
                    title="Edit template"
                  >
                    <Edit3 size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(template)}
                    className="text-slate-500"
                    aria-label={`Delete ${template.name}`}
                    title="Delete template"
                  >
                    <Trash2 size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(template)}
                    className="text-teal-700"
                    aria-label={`${template.status === "ACTIVE" ? "Deactivate" : "Activate"} ${template.name}`}
                  >
                    {template.status === "ACTIVE" ? (
                      <ToggleRight size={24} />
                    ) : (
                      <ToggleLeft size={24} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
