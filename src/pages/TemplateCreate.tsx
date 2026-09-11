import { FormEvent, lazy, Suspense, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { TemplateBuilder } from "../components/TemplateBuilder";
import { storage } from "../services/storage";
import { TemplateLayout } from "../types";
import { createDefaultLayout } from "../utils/templateLayout";
import { validateTemplate } from "../utils/templateValidation";

export function TemplateCreate() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [layout, setLayout] = useState<TemplateLayout>(createDefaultLayout);
  const [error, setError] = useState("");
  const [backgroundUploading, setBackgroundUploading] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateTemplate(name, layout);
    if (validationError) return setError(validationError);
    if (backgroundUploading || layout.background?.startsWith("blob:")) {
      return setError("Wait for the background image upload to finish.");
    }
    const timestamp = new Date().toISOString();
    const template = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      previewImage: layout.background,
      layout,
      design: "konva",
      status: "ACTIVE" as const,
      createdBy: storage.getUser()?.id || "u-admin",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await storage.saveTemplate(template);
    navigate(`/document-templates/${template.id}`);
  };

  return (
    <div className="space-y-6">
      <Link to="/document-templates" className="inline-flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="mr-2 h-5 w-5" />
        Back to Templates
      </Link>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600">Design library</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">New template</h2>
      </div>
      <form onSubmit={save} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Template name
            <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Modern Professional" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Description
            <input value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Short description" />
          </label>
        </div>
        <Suspense fallback={<div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">Loading template editor...</div>}>
          <TemplateBuilder
            template={{ id: "draft", name, description, design: "konva", status: "ACTIVE", createdBy: storage.getUser()?.id || "u-admin", createdAt: "", updatedAt: "", layout }}
            onChange={setLayout}
            onBackgroundUploadChange={setBackgroundUploading}
          />
        </Suspense>
        {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={backgroundUploading} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
          {backgroundUploading ? "Uploading background..." : "Create template"}
        </button>
      </form>
    </div>
  );
}