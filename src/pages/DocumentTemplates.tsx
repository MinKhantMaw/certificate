import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Palette,
  Plus,
} from "lucide-react";
import { storage } from "../services/storage";
import { DocumentTemplate } from "../types";

export function DocumentTemplates() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    storage
      .initTemplates()
      .then((loadedTemplates) => {
        setTemplates(loadedTemplates);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0054a6]">
            Design library
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">
            Templates
          </h2>
          <p className="mt-2 text-slate-500">
            Choose the visual system that every achievement inherits.
          </p>
        </div>
        <Link
          to="/document-templates/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#0054a6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#003f82]"
        >
          <Plus size={17} />
          New template
        </Link>
      </div>
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
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
                <div className="flex items-center gap-3">
                  <Link
                    to={`/document-templates/${template.id}`}
                    className="text-sm font-medium text-[#0054a6] hover:text-[#003f82]"
                  >
                    View details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
