import { FormEvent, lazy, Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Palette, Trash2 } from "lucide-react";
import { storage } from "../services/storage";
import { DocumentTemplate, TemplateLayout } from "../types";
import { getTemplateKeys } from "../utils";
import { downloadSampleImportWorkbook } from "../utils/sampleImportWorkbook";
import { createDefaultLayout } from "../utils/templateLayout";
import { validateTemplate } from "../utils/templateValidation";

const TemplateBuilder = lazy(() =>
  import("../components/TemplateBuilder").then(({ TemplateBuilder }) => ({
    default: TemplateBuilder,
  })),
);

function humanizeTemplateKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function TemplateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [layout, setLayout] = useState<TemplateLayout>(createDefaultLayout);
  const [backgroundUploading, setBackgroundUploading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    storage.initTemplates().then((templates) => {
      if (active) {
        const selectedTemplate = templates.find((item) => item.id === id) || null;
        setTemplate(selectedTemplate);
        setName(selectedTemplate?.name || "");
        setDescription(selectedTemplate?.description || "");
        setLayout(selectedTemplate?.layout || createDefaultLayout());
        setError("");
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading template...</p>;
  }

  if (!template) {
    return (
      <div className="p-8 text-center text-gray-500">
        Template not found.
        <br />
        <Link to="/document-templates" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to Templates
        </Link>
      </div>
    );
  }

  const fields = getTemplateKeys(template.layout).map(humanizeTemplateKey);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateTemplate(name, layout);
    if (validationError) return setError(validationError);
    if (backgroundUploading || layout.background?.startsWith("blob:")) {
      return setError("Wait for the background image upload to finish.");
    }
    const updatedTemplate = {
      ...template,
      name: name.trim(),
      description: description.trim(),
      previewImage: layout.background || template.previewImage,
      layout,
      updatedAt: new Date().toISOString(),
    };
    await storage.updateTemplate(updatedTemplate);
    setTemplate(updatedTemplate);
    setError("");
  };
  const remove = async () => {
    if (!window.confirm(`Delete the template "${template.name}"?`)) return;
    try {
      await storage.deleteTemplate(template.id);
      navigate("/document-templates");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete the template.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <Link to="/document-templates" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Templates
        </Link>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => downloadSampleImportWorkbook(template.name, template.layout)}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Download sample
          </button>
          <button
            type="button"
            onClick={remove}
            className="inline-flex items-center rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete template
          </button>
        </div>
      </div>
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div>
        <h2 className="text-3xl font-semibold text-slate-950">{template.name}</h2>
        <p className="mt-2 text-slate-500">{template.description || "No description provided."}</p>
      </div>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-950">Dynamic fields</h3>
        {fields.length ? (
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {fields.map((field) => <li key={field}>{field}</li>)}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No dynamic fields are configured.</p>
        )}
      </section>
      <form onSubmit={save} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-950">Edit template</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Template name
            <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Description
            <input value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
        </div>
        <Suspense fallback={<div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">Loading template editor...</div>}>
          <TemplateBuilder
            key={template.id}
            template={{ ...template, name, description, layout }}
            onChange={setLayout}
            onBackgroundUploadChange={setBackgroundUploading}
          />
        </Suspense>
        <button disabled={backgroundUploading} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
          {backgroundUploading ? "Uploading background..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}