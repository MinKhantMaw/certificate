import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Check, Plus, Users } from "lucide-react";
import { storage } from "../services/storage";
import { TrainingProgram } from "../types";

export function TrainingPrograms() {
  const [programs, setPrograms] = useState(storage.getTrainings());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    organization: "",
    startDate: "",
    endDate: "",
    template: "",
  });
  const trainers = storage.getUsersByRole("TRAINER");
  const approvers = storage.getUsersByRole("APPROVER");
  const templates = storage
    .getTemplates()
    .filter((item) => item.status === "ACTIVE");
  const update = (key: string, value: string) =>
    setForm({ ...form, [key]: value });
  const create = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.code || !form.template) return;
    const program: TrainingProgram = {
      id: crypto.randomUUID(),
      name: form.name,
      description: "New training program",
      trainingCode: form.code.toUpperCase(),
      organization: form.organization,
      startDate: form.startDate,
      endDate: form.endDate,
      duration: "To be confirmed",
      location: "To be confirmed",
      trainingType: "Professional development",
      trainerIds: trainers.slice(0, 1).map((item) => item.id),
      approverIds: approvers.slice(0, 1).map((item) => item.id),
      certificateTemplateId: form.template,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
    };
    storage.saveTraining(program);
    storage.addAuditLog("Training created", "TrainingProgram", program.id);
    setPrograms(storage.getTrainings());
    setShowForm(false);
    setForm({
      name: "",
      code: "",
      organization: "",
      startDate: "",
      endDate: "",
      template: "",
    });
  };
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600">
            Program operations
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">
            Achievements
          </h2>
          <p className="mt-2 text-slate-500">
            Every certificate starts with an achievement, its people, and its
            template.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={17} /> New program
        </button>
      </div>
      {showForm && (
        <form
          onSubmit={create}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Program name"
              value={form.name}
              onChange={(v) => update("name", v)}
              placeholder="Advanced React Patterns"
            />
            <Field
              label="Training code"
              value={form.code}
              onChange={(v) => update("code", v)}
              placeholder="REACT-26"
            />
            <Field
              label="Organization"
              value={form.organization}
              onChange={(v) => update("organization", v)}
              placeholder="KBZ Bank"
            />
            <Field
              label="Start date"
              type="date"
              value={form.startDate}
              onChange={(v) => update("startDate", v)}
            />
            <Field
              label="End date"
              type="date"
              value={form.endDate}
              onChange={(v) => update("endDate", v)}
            />
            <label className="text-sm font-medium text-slate-700">
              Certificate template
              <select
                required
                value={form.template}
                onChange={(e) => update("template", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Select active template</option>
                {templates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Assigned trainer
              </p>
              <div className="flex flex-wrap gap-2">
                {trainers.map((item) => (
                  <span
                    key={item.id}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                  >
                    <Users size={13} className="mr-1 inline" />
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">
                Approval policy
              </p>
              <p className="text-sm text-slate-500">
                <Check size={15} className="mr-1 inline text-emerald-600" />
                All selected approvers required
              </p>
            </div>
          </div>
          <button className="mt-5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
            Create program
          </button>
        </form>
      )}
      <div className="grid gap-4">
        {programs.map((program) => {
          const template =
            templates.find(
              (item) => item.id === program.certificateTemplateId,
            ) ||
            storage
              .getTemplates()
              .find((item) => item.id === program.certificateTemplateId);
          return (
            <Link
              to={`/training-programs/${program.id}`}
              key={program.id}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-400"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-950">
                      {program.name}
                    </h3>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                      {program.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {program.organization} ·{" "}
                    <span className="font-mono">{program.trainingCode}</span>
                  </p>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <CalendarDays size={15} className="mr-1 inline" />
                  {program.startDate || "Date pending"}
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-md bg-slate-50 px-2.5 py-1">
                  Template: {template?.name || "Missing"}
                </span>
                <span className="rounded-md bg-slate-50 px-2.5 py-1">
                  {program.trainerIds.length} trainer
                </span>
                <span className="rounded-md bg-slate-50 px-2.5 py-1">
                  {program.approverIds.length} approver
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input
        required={label !== "Organization"}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </label>
  );
}
