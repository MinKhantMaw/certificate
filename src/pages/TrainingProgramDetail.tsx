import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Upload, Users } from "lucide-react";
import { storage } from "../services/storage";

export function TrainingProgramDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const program = id ? storage.getTraining(id) : undefined;
  if (!program)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-red-800">
        Training Program not found.
      </div>
    );
  const trainees = storage.getTraineesForTraining(program.id);
  const template = storage
    .getTemplates()
    .find((item) => item.id === program.certificateTemplateId);
  const users = storage.getUsers();
  const certificates = storage.getCertificates();
  const issue = () => {
    try {
      const created = storage.issueCertificates(
        program.id,
        trainees.map((trainee) => trainee.id),
      );
      if (created.length) navigate("/certificates");
      else window.alert("All approved trainees already have certificates.");
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to issue certificates.",
      );
    }
  };
  return (
    <div className="space-y-6">
      <Link
        to="/training-programs"
        className="inline-flex items-center gap-2 text-sm font-medium text-teal-700"
      >
        <ArrowLeft size={16} /> Training programs
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-sm text-teal-700">
            {program.trainingCode}
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">
            {program.name}
          </h2>
          <p className="mt-2 text-slate-500">
            {program.organization} · {program.status}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/training-programs/${program.id}/import`}
            className="inline-flex items-center gap-2 rounded-lg border border-teal-700 px-4 py-2.5 text-sm font-semibold text-teal-700"
          >
            <Upload size={17} /> Import trainees
          </Link>
          <button
            onClick={issue}
            disabled={!trainees.length || program.status !== "COMPLETED"}
            className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Issue certificates
          </button>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-950">Program setup</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-400">Dates</dt>
              <dd className="text-slate-700">
                {program.startDate || "Pending"} to{" "}
                {program.endDate || "Pending"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Certificate template</dt>
              <dd className="text-slate-700">{template?.name || "Missing"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Trainers</dt>
              <dd className="text-slate-700">
                {program.trainerIds
                  .map(
                    (userId) => users.find((user) => user.id === userId)?.name,
                  )
                  .filter(Boolean)
                  .join(", ") || "None"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Approvers</dt>
              <dd className="text-slate-700">
                {program.approverIds
                  .map(
                    (userId) => users.find((user) => user.id === userId)?.name,
                  )
                  .filter(Boolean)
                  .join(", ") || "None"}
              </dd>
            </div>
          </dl>
        </section>
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-5">
            <div>
              <h3 className="font-semibold text-slate-950">
                Approved trainees
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Only approved import records appear here.
              </p>
            </div>
            <span className="rounded-full bg-teal-100 px-3 py-1 text-sm font-semibold text-teal-700">
              {trainees.length} active
            </span>
          </div>
          {trainees.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto text-slate-300" size={40} />
              <p className="mt-3 text-sm text-slate-500">
                No approved trainees yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {["Name", "Email", "Employee ID", "Certificate"].map(
                      (label) => (
                        <th
                          key={label}
                          className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                        >
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trainees.map((trainee) => {
                    const cert = certificates.find(
                      (item) => item.traineeId === trainee.id,
                    );
                    return (
                      <tr key={trainee.id}>
                        <td className="px-5 py-4 text-sm font-medium text-slate-900">
                          {trainee.recipientName}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {trainee.email}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-600">
                          {trainee.employeeId || "-"}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">
                          {cert?.status || "Not issued"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
