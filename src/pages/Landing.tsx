import { Link } from "react-router-dom";
import {
  ArrowRight,
  FileBadge,
  FileSpreadsheet,
  FileText,
  LockKeyhole,
  PenLine,
  QrCode,
} from "lucide-react";
const features = [
  {
    icon: FileText,
    title: "Reusable templates",
    description:
      "Design a polished document once, then keep every issued document consistent.",
  },
  {
    icon: FileSpreadsheet,
    title: "Spreadsheet generation",
    description:
      "Turn rows of recipient data into finished documents without repetitive entry.",
  },
  {
    icon: PenLine,
    title: "Approval and signatures",
    description:
      "Move documents through review, approval, and signature workflows with clarity.",
  },
  {
    icon: QrCode,
    title: "Instant verification",
    description:
      "Give every document a trusted QR-backed path for checking authenticity.",
  },
];

export function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#002c76] font-sans text-slate-900">
      <header className="relative z-10 border-b border-white/15 bg-[#002c76]/95 text-white backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Kanva home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e11e26] text-white">
              <FileBadge className="w-6 h-6" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Kanva</span>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white transition hover:border-[#66a9df] hover:text-[#66a9df]"
          >
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main>
        <section className="relative border-b border-white/10 bg-[#002c76] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(225,30,38,0.18),transparent_30%),radial-gradient(circle_at_15%_80%,rgba(0,84,166,0.45),transparent_28%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-32">
            <div className="max-w-3xl">
              <p className="mb-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em]">
                <LockKeyhole className="h-4 w-4" />
                Documents with a longer life
              </p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Design once,  use indefinitely
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                Build a dependable document system for your organization. Create
                once, issue at scale, and make every document easy to trust.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0054a6] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#003f82]"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:justify-self-end">
              <div className="rounded-[2rem] border border-white/15 bg-white/10 p-3 shadow-2xl shadow-[#001f52]/40 backdrop-blur">
                <div className="rounded-[1.5rem] bg-white p-7 text-slate-900 sm:p-9">
                  <div className="flex items-start justify-between border-b border-slate-200 pb-6">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0054a6]">
                        Official document
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                        Built to be trusted
                      </h2>
                    </div>
                    <FileBadge className="h-8 w-8 text-[#0054a6]" />
                  </div>
                  <div className="space-y-5 py-7">
                    <div className="h-2 w-4/5 rounded-full bg-slate-200" />
                    <div className="h-2 w-full rounded-full bg-slate-100" />
                    <div className="h-2 w-3/5 rounded-full bg-slate-100" />
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-[#fff1f1] p-4 text-sm text-[#002c76]">
                    <span className="font-medium">Verification ready</span>
                    <QrCode className="h-8 w-8 text-[#0054a6]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-20 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0054a6]">
                One connected workflow
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                From first layout to final verification.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Keep the work behind every document organized, repeatable, and
                ready for the people who rely on it.
              </p>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="border-t-2 border-slate-200 pt-6 transition hover:border-[#0054a6]"
                >
                  <Icon className="h-7 w-7 text-[#0054a6]" />
                  <h3 className="mt-6 text-lg font-semibold text-slate-950">
                    {title}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f4f7fb] px-6 py-16 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Ready to make your documents work harder?
              </h2>
              <p className="mt-2 text-slate-600">
                Bring your templates, data, and review process together.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#0054a6] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#003f82]"
            >
              Enter the portal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}