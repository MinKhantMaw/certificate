import { ChangeEvent, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronRight, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Certificate, CertificateTemplate, ImportBatch, ImportedRow } from "../types";
import { storage } from "../services/storage";
import { getTemplateKeys } from "../utils";
import { CertificatePreview } from "../components/CertificatePreview";
import { MAX_IMPORT_FILE_SIZE, MAX_IMPORT_ROWS, parseImportedRow } from "../utils/importRows";

type ImportStep = "UPLOAD" | "PREVIEW" | "COMPLETED";
const PREVIEW_PAGE_SIZE = 100;

export function ImportExcel() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState(() => storage.getTemplates());
  const [templateId, setTemplateId] = useState("");
  const [step, setStep] = useState<ImportStep>("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const template = templates.find((item) => item.id === templateId && item.status === "ACTIVE");

  useEffect(() => { storage.initTemplates().then(setTemplates).catch(() => setError("Unable to load certificate templates.")); }, []);

  const upload = (selectedFile: File) => {
    if (!template) return setError("Select an active certificate template before uploading Excel.");
    if (selectedFile.size > MAX_IMPORT_FILE_SIZE) return setError("Excel files must be 10 MB or smaller.");
    setError("");
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const XLSX = await import("xlsx");
        const sheet = XLSX.read(event.target?.result, { type: "array" }).Sheets;
        const firstSheet = sheet[Object.keys(sheet)[0]];
        const source = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
        if (!source.length) throw new Error("The Excel file contains no rows.");
        if (source.length > MAX_IMPORT_ROWS) throw new Error(`Excel files are limited to ${MAX_IMPORT_ROWS} rows.`);
        const seen = new Set<string>();
        setRows(source.map((row) => parseImportedRow(row, getTemplateKeys(template.layout), seen)));
        setFile(selectedFile); setPage(0); setStep("PREVIEW");
      } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to parse this Excel file."); }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const generate = () => {
    if (!template || !file || rows.some((row) => !row.isValid)) return;
    try {
      const certificates = storage.generateCertificates(rows, template.id);
      const timestamp = new Date().toISOString();
      const nextBatch: ImportBatch = { id: `IMP-${new Date().getFullYear()}-${String(storage.getImportBatches().length + 1).padStart(3, "0")}`, templateId: template.id, fileName: file.name, totalRows: rows.length, validRows: rows.length, invalidRows: 0, status: "COMPLETED", uploadedBy: storage.getUser()?.id || "unknown", submittedAt: timestamp, createdAt: timestamp, updatedAt: timestamp };
      storage.saveImportBatch(nextBatch); setBatch(nextBatch); setStep("COMPLETED");
      if (!certificates.length) throw new Error("No certificates were generated.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to generate certificates."); }
  };

  const activeTemplates = templates.filter((item) => item.status === "ACTIVE");
  const validCount = rows.filter((row) => row.isValid).length;
  const visibleRows = rows.slice(page * PREVIEW_PAGE_SIZE, (page + 1) * PREVIEW_PAGE_SIZE);
  return <div className="space-y-6">
    <Link to="/certificates" className="inline-flex items-center gap-2 text-sm font-medium text-teal-700"><ChevronRight className="rotate-180" size={16} /> Back to certificates</Link>
    <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600">Data intake</p><h2 className="mt-2 text-3xl font-semibold text-slate-950">Upload certificates</h2><p className="mt-2 text-slate-500">Select a template, validate an Excel file, then generate certificates.</p></div>
    <label className="block max-w-xl text-sm font-medium text-slate-700">Certificate template<select value={templateId} onChange={(event) => { setTemplateId(event.target.value); setRows([]); setFile(null); setStep("UPLOAD"); setError(""); }} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">Select active template</option>{activeTemplates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{!activeTemplates.length && <span className="mt-2 block text-sm font-normal text-amber-700">Create an active template before uploading certificates.</span>}</label>
    {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {step === "UPLOAD" && <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm"><Upload className="mx-auto text-teal-600" size={42} /><h3 className="mt-4 text-lg font-semibold text-slate-950">Upload Excel roster</h3><p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">Required columns: recipient_name and email. Include every selected template placeholder.</p><label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"><Upload size={17} /> Select Excel file<input type="file" accept=".xlsx,.xls" disabled={!template} className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => event.target.files?.[0] && upload(event.target.files[0])} /></label></div>}
    {step === "PREVIEW" && template && <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-5"><div><h3 className="font-semibold text-slate-950">Preview imported data</h3><p className="text-sm text-slate-500">{file?.name} · {rows.length} rows · {validCount} valid</p></div><div className="flex gap-3"><button onClick={() => setStep("UPLOAD")} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Choose another</button><button disabled={validCount !== rows.length} onClick={generate} className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Generate certificates</button></div></div><div className="border-b border-slate-200 bg-slate-50 p-5"><p className="mb-3 text-sm font-semibold text-slate-700">Certificate preview using {template.name}</p><div className="overflow-x-auto"><CertificatePreview certificate={previewCertificate(rows[0], template.id)} /></div></div><div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200"><thead><tr>{["Validation", "Name", "Email", "Employee ID", "Department", "Errors"].map((label) => <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</th>)}</tr></thead><tbody>{visibleRows.map((row, index) => <tr key={index} className={row.isValid ? "" : "bg-red-50/60"}><td className="px-4 py-3">{row.isValid ? <CheckCircle2 className="text-emerald-600" size={18} /> : <AlertCircle className="text-red-600" size={18} />}</td><td className="px-4 py-3 text-sm">{row.recipient_name}</td><td className="px-4 py-3 text-sm">{row.email}</td><td className="px-4 py-3 text-sm">{row.employee_id || "-"}</td><td className="px-4 py-3 text-sm">{row.department || "-"}</td><td className="px-4 py-3 text-sm text-red-700">{row.errors?.join(", ") || "-"}</td></tr>)}</tbody></table></div>{rows.length > PREVIEW_PAGE_SIZE && <div className="flex justify-end gap-2 border-t p-3"><button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><button disabled={(page + 1) * PREVIEW_PAGE_SIZE >= rows.length} onClick={() => setPage(page + 1)}>Next</button></div>}</div>}
    {step === "COMPLETED" && batch && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-10 text-center"><CheckCircle2 className="mx-auto text-emerald-600" size={48} /><h3 className="mt-4 text-2xl font-semibold text-emerald-950">Certificates generated</h3><p className="mt-2 text-emerald-800">{batch.id} · {batch.validRows} certificates were created.</p><button onClick={() => navigate("/certificates")} className="mt-6 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Return to certificates</button></div>}
  </div>;
}

function previewCertificate(row: ImportedRow, templateId: string): Certificate { const data = row.dynamicData || {}; return { id: "preview", certificateNumber: "PREVIEW", shortId: "PREVIEW-01", verificationToken: "preview", verificationUrl: "", recipientName: row.recipient_name, certificateTitle: String(data.certificate_title || row.certificate_title || "Certificate of Completion"), courseName: String(data.course || data.course_name || row.course_name), issueDate: String(data.issue_date || data.completion_date || row.issue_date), organization: String(data.organization || row.organization), certificateType: String(data.certificate_type || row.certificate_type || "completion"), email: row.email, status: "DRAFT", certificateTemplateId: templateId, dynamicData: data, createdAt: new Date().toISOString() }; }