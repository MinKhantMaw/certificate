import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, FileSpreadsheet, History } from "lucide-react";
import { ImportBatch } from "../types";
import { storage } from "../services/storage";
import { formatDate } from "../utils";

export function ImportHistory() {
  const [imports, setImports] = useState<ImportBatch[]>([]);
  const [templates, setTemplates] = useState(() => storage.getTemplates());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    setImports(storage.getImportBatches());
    storage.initTemplates().then(setTemplates);
  }, []);

  const totalPages = Math.max(1, Math.ceil(imports.length / pageSize));
  const visibleImports = imports.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600">
          Data intake
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">
          Import history
        </h2>
        <p className="mt-2 text-slate-500">
          Review every document file generated from a selected template.
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "File",
                  "Template",
                  "Rows",
                  "Status",
                  "Submitted",
                ].map((label) => (
                  <th
                    key={label}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {imports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <History
                      className="mx-auto mb-3 text-slate-300"
                      size={40}
                    />
                    No import batches yet.
                  </td>
                </tr>
              ) : (
                visibleImports.map((batch) => (
                  <tr key={batch.id}>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      <FileSpreadsheet
                        className="mr-2 inline text-emerald-600"
                        size={16}
                      />
                      {batch.fileName}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {templates.find((template) => template.id === batch.templateId)?.name || "Unknown"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {batch.validRows} valid / {batch.totalRows} total
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700"
                      >
                        {batch.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(batch.submittedAt || batch.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {imports.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, imports.length)} of {imports.length}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2">
                Per page
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </label>
              <span className="px-2">Page {page} of {totalPages}</span>
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-md border border-slate-300 p-1.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-md border border-slate-300 p-1.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
