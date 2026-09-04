import { Link } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";
import { storage } from "../services/storage";

export function ImportApprovals() {
  const user = storage.getUser();
  const users = storage.getUsers();
  const pending = storage
    .getImportBatches()
    .filter(
      (batch) =>
        batch.status === "PENDING_APPROVAL" &&
        storage
          .getTraining(batch.trainingProgramId)
          ?.approverIds.includes(user?.id || ""),
    );
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
          Stage one approval
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">
          Import approvals
        </h2>
        <p className="mt-2 text-slate-500">
          Verify trainee data before it becomes active in a training program.
        </p>
      </div>
      {pending.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-14 text-center">
          <ClipboardCheck className="mx-auto text-slate-300" size={42} />
          <h3 className="mt-4 font-semibold text-slate-900">
            No imports waiting
          </h3>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Import",
                  "Training",
                  "Uploaded by",
                  "Records",
                  "Status",
                  "Action",
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
              {pending.map((batch) => {
                const program = storage.getTraining(batch.trainingProgramId);
                return (
                  <tr key={batch.id}>
                    <td className="px-5 py-4 font-mono text-sm text-slate-900">
                      {batch.id}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-700">
                      {program?.name}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {users.find(
                        (userItem) => userItem.id === batch.uploadedBy,
                      )?.name || "Admin"}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {batch.validRows} valid / {batch.totalRows} total
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                        PENDING
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/approvals/imports/${batch.id}`}
                        className="font-semibold text-teal-700"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
