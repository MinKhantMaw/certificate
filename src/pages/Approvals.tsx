import { useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { storage } from "../services/storage";

export function Approvals() {
  const user = storage.getUser();
  const [approvals, setApprovals] = useState(
    storage
      .getApprovals()
      .filter(
        (item) => item.approverId === user?.id && item.status === "PENDING",
      ),
  );
  const certs = storage.getCertificates();

  const act = (approvalId: string, status: "APPROVED" | "REJECTED") => {
    const approval = storage
      .getApprovals()
      .find((item) => item.id === approvalId);
    if (!approval) return;

    const timestamp = new Date().toISOString();

    storage.updateApproval({
      ...approval,
      status,
      approvedAt: status === "APPROVED" ? timestamp : undefined,
      rejectedAt: status === "REJECTED" ? timestamp : undefined,
      updatedAt: timestamp,
    });

    // Single-approval model: whichever approver decides first finalizes the certificate.
    storage.updateCertificateStatus(
      approval.certificateId,
      status === "APPROVED" ? "VALID" : "REJECTED",
    );

    // Close out any other still-pending approval records for this certificate
    // so it doesn't linger as "pending" in other approvers' queues.
    storage
      .getApprovalsForCertificate(approval.certificateId)
      .filter((item) => item.id !== approvalId && item.status === "PENDING")
      .forEach((item) =>
        storage.updateApproval({ ...item, status, updatedAt: timestamp }),
      );

    setApprovals(
      storage
        .getApprovals()
        .filter(
          (item) => item.approverId === user?.id && item.status === "PENDING",
        ),
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
          Decision queue
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">
          Pending approvals
        </h2>
        <p className="mt-2 text-slate-500">
          Review certificates assigned to you. Approving or rejecting finalizes
          the certificate immediately.
        </p>
      </div>
      {user?.role !== "APPROVER" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Sign in as an approver to action this queue. Demo:
          approver@example.com / admin123.
        </div>
      )}
      {approvals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-14 text-center">
          <ShieldCheck className="mx-auto text-slate-300" size={42} />
          <h3 className="mt-4 font-semibold text-slate-900">Queue is clear</h3>
          <p className="mt-1 text-sm text-slate-500">
            No certificates are waiting for your decision.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Certificate",
                  "Trainee",
                  "Training",
                  "Status",
                  "Actions",
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
              {approvals.map((approval) => {
                const cert = certs.find(
                  (item) => item.id === approval.certificateId,
                );
                if (!cert) return null;
                return (
                  <tr key={approval.id}>
                    <td className="px-5 py-4 font-mono text-sm text-slate-900">
                      {cert.certificateNumber}
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-900">
                      {cert.recipientName}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {cert.courseName}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                        PENDING
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => act(approval.id, "APPROVED")}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => act(approval.id, "REJECTED")}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
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
