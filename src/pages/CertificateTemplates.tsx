import { useState } from "react";
import { Palette, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { storage } from "../services/storage";
import { CertificateTemplate } from "../types";

export function CertificateTemplates() {
  const [templates, setTemplates] = useState(storage.getTemplates());
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const save = () => {
    if (!name.trim()) return;
    const template: CertificateTemplate = {
      id: crypto.randomUUID(),
      name,
      description,
      design: "classic",
      status: "ACTIVE",
      createdBy: storage.getUser()?.id || "u-admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    storage.saveTemplate(template);
    setTemplates(storage.getTemplates());
    setName("");
    setDescription("");
    setShowForm(false);
  };
  const toggle = (template: CertificateTemplate) => {
    storage.updateTemplate({
      ...template,
      status: template.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      updatedAt: new Date().toISOString(),
    });
    setTemplates(storage.getTemplates());
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
            Choose the visual system that every training program inherits.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={17} /> New template
        </button>
      </div>
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
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
          <button
            onClick={save}
            className="mt-4 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Create template
          </button>
        </div>
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex aspect-[1.45] items-center justify-center bg-gradient-to-br from-slate-950 via-teal-900 to-amber-200 p-5">
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
                <button
                  onClick={() => toggle(template)}
                  className="text-teal-700"
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
        ))}
      </div>
    </div>
  );
}
