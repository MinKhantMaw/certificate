import { useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { storage } from "../services/storage";

export function ImportApprovalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = storage.getUser();
  const batch = id ? storage.getImportBatch(id) : undefined;
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  if (!batch)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-red-800">
        Import batch not found.
      </div>
    );
  const program = storage.getTraining(batch.trainingProgramId);
  const rows = storage.getPendingImportTrainees(batch.id);
  const review = (action: "approve" | "reject") => {
    try {
      if (action === "reject" && !reason.trim()) {
        setError("A rejection reason is required.");
        return;
      }
      if (action === "approve") storage.approveImport(batch.id, user?.id || "");
      else storage.rejectImport(batch.id, user?.id || "", reason);
      navigate("/approvals/imports");
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : "Unable to update import.",
      );
    }
  };
  return (
    <div className="space-y-6">
      <Link
        to="/approvals/imports"
        className="inline-flex items-center gap-2 text-sm font-medium text-teal-700"
      >
        <ArrowLeft size={16} /> Import approvals
      </Link>
      <div>
        <p className="font-mono text-sm text-amber-700">{batch.id}</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">
          Review import
        </h2>
        <p className="mt-2 text-slate-500">
          {batch.fileName} · {program?.name} · {program?.trainingCode}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Total rows", batch.totalRows],
          ["Valid rows", batch.validRows],
          ["Invalid rows", batch.invalidRows],
          ["Status", batch.status],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs uppercase tracking-wider text-slate-400">
              {label}
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h3 className="font-semibold text-slate-950">
            Imported trainee records
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Name",
                  "Email",
                  "Employee ID",
                  "Department",
                  "Validation",
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
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">
                    {row.recipientName}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {row.email}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {row.employeeId || "-"}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {row.department || "-"}
                  </td>
                  <td className="px-5 py-4 text-sm">
                    {row.validationStatus === "VALID" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 size={16} /> VALID
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700">
                        <XCircle size={16} /> {row.validationErrors.join(", ")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-end gap-3">
        <div className="min-w-72">
          <label className="text-sm font-medium text-slate-700">
            Rejection reason
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Explain what needs correction"
            />
          </label>
        </div>
        <button
          onClick={() => review("reject")}
          className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700"
        >
          Reject import
        </button>
        <button
          disabled={batch.invalidRows > 0}
          onClick={() => review("approve")}
          className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Approve import
        </button>
      </div>
    </div>
  );
}
