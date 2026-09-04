import { ChangeEvent, useState } from "react";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Upload,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ImportBatch, ImportedRow, PendingImportTrainee } from "../types";
import { storage } from "../services/storage";

type ImportStep = "UPLOAD" | "PREVIEW" | "SUBMITTED";

export function ImportExcel() {
  const { id: trainingProgramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const program = trainingProgramId
    ? storage.getTraining(trainingProgramId)
    : undefined;
  const [step, setStep] = useState<ImportStep>("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [error, setError] = useState("");

  const parseExcel = (selectedFile: File) => {
    setError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target?.result, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          sheet,
          { defval: "" },
        );
        const required = ["recipient_name", "email", "training_code"];
        const seen = new Set<string>();
        const parsed = rawRows.map((row) => {
          const code = String(row.training_code || "").trim();
          const email = String(row.email || "").trim();
          const name = String(row.recipient_name || "").trim();
          const errors = required
            .filter((column) => !String(row[column] || "").trim())
            .map((column) => `Missing ${column}`);
          if (code && program && code !== program.trainingCode)
            errors.push(
              "The training code in the Excel file does not match the selected Training Program.",
            );
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.push("Invalid email");
          const duplicateKey = `${email.toLowerCase()}|${code}`;
          if (seen.has(duplicateKey)) errors.push("Duplicate trainee");
          seen.add(duplicateKey);
          return {
            recipient_name: name,
            email,
            training_code: code,
            employee_id: String(row.employee_id || "").trim(),
            department: String(row.department || "").trim(),
            position: String(row.position || "").trim(),
            completion_date: String(row.completion_date || "").trim(),
            certificate_title: "",
            course_name: "",
            issue_date: "",
            organization: "",
            certificate_type: "",
            isValid: errors.length === 0,
            errors,
          };
        });
        if (!rawRows.length)
          throw new Error("The Excel file contains no rows.");
        setRows(parsed);
        setFile(selectedFile);
        setStep("PREVIEW");
      } catch (parseError) {
        setError(
          parseError instanceof Error
            ? parseError.message
            : "Unable to parse this Excel file.",
        );
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const submitForApproval = () => {
    if (
      !program ||
      !file ||
      rows.some((row) =>
        row.errors?.some((message) => message.includes("does not match")),
      )
    )
      return;
    const validRows = rows.filter((row) => row.isValid);
    const timestamp = new Date().toISOString();
    const importBatch: ImportBatch = {
      id: `IMP-${new Date().getFullYear()}-${String(storage.getImportBatches().length + 1).padStart(3, "0")}`,
      trainingProgramId: program.id,
      fileName: file.name,
      totalRows: rows.length,
      validRows: validRows.length,
      invalidRows: rows.length - validRows.length,
      status: "PENDING_APPROVAL",
      uploadedBy: storage.getUser()?.id || "unknown",
      submittedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const pendingRows: PendingImportTrainee[] = rows.map((row, index) => ({
      id: crypto.randomUUID(),
      importBatchId: importBatch.id,
      trainingProgramId: program.id,
      recipientName: row.recipient_name,
      email: row.email,
      employeeId: row.employee_id,
      trainingCode: row.training_code || "",
      department: row.department,
      position: row.position,
      completionDate: row.completion_date,
      validationStatus: row.isValid ? "VALID" : "INVALID",
      validationErrors: row.errors || [],
    }));
    storage.saveImportBatch(importBatch);
    storage.savePendingImportTrainees(pendingRows);
    storage.addAuditLog(
      "Import submitted for approval",
      "ImportBatch",
      importBatch.id,
    );
    setBatch(importBatch);
    setStep("SUBMITTED");
  };

  if (!program)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-red-800">
        Training Program not found.
      </div>
    );
  const validCount = rows.filter((row) => row.isValid).length;
  return (
    <div className="space-y-6">
      <Link
        to={`/training-programs/${program.id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-teal-700"
      >
        <ArrowLeft size={16} /> Back to {program.name}
      </Link>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600">
          {program.trainingCode}
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">
          Import trainees
        </h2>
        <p className="mt-2 text-slate-500">
          Upload records for <strong>{program.name}</strong>. The selected
          program is the source of truth.
        </p>
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="flex items-center justify-center gap-3 text-sm">
        <Step
          active={step === "UPLOAD"}
          complete={step !== "UPLOAD"}
          label="Upload"
        />
        <ChevronRight className="text-slate-300" />
        <Step
          active={step === "PREVIEW"}
          complete={step === "SUBMITTED"}
          label="Validate & preview"
        />
        <ChevronRight className="text-slate-300" />
        <Step active={step === "SUBMITTED"} complete={false} label="Approval" />
      </div>
      {step === "UPLOAD" && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Upload className="mx-auto text-teal-600" size={42} />
          <h3 className="mt-4 text-lg font-semibold text-slate-950">
            Upload Excel roster
          </h3>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
            Required columns: recipient_name, email, training_code. Optional:
            employee_id, department, position, completion_date.
          </p>
          <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white">
            <Upload size={17} /> Select Excel file
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                event.target.files?.[0] && parseExcel(event.target.files[0])
              }
            />
          </label>
        </div>
      )}
      {step === "PREVIEW" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-5">
            <div>
              <h3 className="font-semibold text-slate-950">
                Preview imported data
              </h3>
              <p className="text-sm text-slate-500">
                {file?.name} · {rows.length} rows · {validCount} valid
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("UPLOAD")}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Choose another
              </button>
              <button
                disabled={
                  !validCount ||
                  rows.some((row) =>
                    row.errors?.some((message) =>
                      message.includes("does not match"),
                    ),
                  )
                }
                onClick={submitForApproval}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Submit for approval
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white">
                <tr>
                  {[
                    "Validation",
                    "Name",
                    "Email",
                    "Training code",
                    "Employee ID",
                    "Department",
                    "Errors",
                  ].map((label) => (
                    <th
                      key={label}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, index) => (
                  <tr key={index} className={row.isValid ? "" : "bg-red-50/60"}>
                    <td className="px-4 py-3">
                      {row.isValid ? (
                        <CheckCircle2 className="text-emerald-600" size={18} />
                      ) : (
                        <AlertCircle className="text-red-600" size={18} />
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                      {row.recipient_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                      {row.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-slate-600">
                      {row.training_code}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {row.employee_id || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {row.department || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-700">
                      {row.errors?.join(", ") || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {step === "SUBMITTED" && batch && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-10 text-center">
          <CheckCircle2 className="mx-auto text-emerald-600" size={48} />
          <h3 className="mt-4 text-2xl font-semibold text-emerald-950">
            Import submitted for approval
          </h3>
          <p className="mt-2 text-emerald-800">
            {batch.id} · {batch.validRows} valid rows are waiting for an
            approver.
          </p>
          <button
            onClick={() => navigate(`/training-programs/${program.id}`)}
            className="mt-6 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Return to training program
          </button>
        </div>
      )}
    </div>
  );
}
function Step({
  active,
  complete,
  label,
}: {
  active: boolean;
  complete: boolean;
  label: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 font-medium ${active ? "text-teal-700" : complete ? "text-emerald-600" : "text-slate-400"}`}
    >
      {complete ? (
        <CheckCircle2 size={18} />
      ) : (
        <span className="flex h-5 w-5 items-center justify-center rounded-full border text-xs">
          {active ? "•" : ""}
        </span>
      )}
      {label}
    </div>
  );
}
