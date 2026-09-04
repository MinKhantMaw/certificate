import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, Upload } from "lucide-react";
import { storage } from "../services/storage";

export function ImportProgramSelect() {
  const programs = storage.getTrainings();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-600">
          Data intake
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-950">
          Import trainees
        </h2>
        <p className="mt-2 text-slate-500">
          Select the achievement that owns this roster before uploading
          Excel.
        </p>
      </div>
      {programs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <ClipboardList className="mx-auto text-slate-300" size={42} />
          <h3 className="mt-4 font-semibold text-slate-900">
            Create an achievement first
          </h3>
          <Link
            to="/training-programs"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Open achievements <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {programs.map((program) => (
            <div
              key={program.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-teal-700">
                    {program.trainingCode}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    {program.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {program.organization}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {program.status}
                </span>
              </div>
              <Link
                to={`/training-programs/${program.id}/import`}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white"
              >
                <Upload size={16} /> Import trainees <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
