import { useEffect, useState } from "react";
import { FileSpreadsheet, History } from "lucide-react";
import { ImportBatch } from "../types";
import { storage } from "../services/storage";
import { formatDate } from "../utils";

export function ImportHistory() {
  const [imports, setImports] = useState<ImportBatch[]>([]);
  useEffect(() => setImports(storage.getImportBatches()), []);
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
          Every roster remains tied to the training program it was submitted
          for.
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Import ID",
                  "File",
                  "Training program",
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
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <History
                      className="mx-auto mb-3 text-slate-300"
                      size={40}
                    />
                    No import batches yet.
                  </td>
                </tr>
              ) : (
                imports.map((batch) => (
                  <tr key={batch.id}>
                    <td className="px-5 py-4 font-mono text-sm text-slate-900">
                      {batch.id}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      <FileSpreadsheet
                        className="mr-2 inline text-emerald-600"
                        size={16}
                      />
                      {batch.fileName}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {storage.getTraining(batch.trainingProgramId)?.name ||
                        "Unknown"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {batch.validRows} valid / {batch.totalRows} total
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${batch.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : batch.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
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
      </div>
    </div>
  );
}
