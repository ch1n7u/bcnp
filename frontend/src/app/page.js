import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8 md:space-y-10">
      {/* ─── Hero Section ─── */}
      <section className="hero-grid rounded-3xl border border-white/50 p-5 shadow-xl sm:p-8 md:p-10 lg:p-12">
        <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-surf px-4 py-1.5 text-xs font-bold tracking-wide text-ocean sm:text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Secure Citizen Portal
            </p>
            <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Secure Cyber Crime Reporting &amp; Case Tracking System
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-700 md:mt-6 md:text-lg">
              Submit cyber crime complaints, upload supporting evidence, and
              track investigation status through a secure and citizen-focused
              platform.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:mt-9 lg:gap-4">
              <Link
                href="/report"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ocean px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-ocean/90 hover:shadow-lg sm:text-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                File a Report
              </Link>
              <Link
                href="/report"
                className="group relative inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-coral px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-coral/90 hover:shadow-lg sm:text-base"
                title="Anonymous reports have limited case tracking capability"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Report Anonymously
                <span className="pointer-events-none absolute -bottom-12 left-1/2 z-10 w-56 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-xs font-normal text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  Anonymous reports may have limited tracking capability
                </span>
              </Link>
              <Link
                href="/track"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-ocean px-5 py-3 text-sm font-semibold text-ocean transition hover:bg-ocean/5 sm:col-span-2 sm:text-base"
                title="You will need your Case ID to track status"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Track Case Status
              </Link>
            </div>
          </div>

          {/* ─── Case Workflow (User-Friendly) ─── */}
          <div className="glass self-start rounded-2xl p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold text-ink">
              How It Works
            </h2>
            <ol className="mt-5 space-y-4">
              {[
                { step: "1", text: "Citizen submits a complaint with details and evidence" },
                { step: "2", text: "Report is reviewed and verified by authorities" },
                { step: "3", text: "Case is assigned to an investigating officer" },
                { step: "4", text: "Evidence analysis and investigation conducted" },
                { step: "5", text: "Status updates shared with the complainant" },
              ].map((item) => (
                <li key={item.step} className="flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ocean text-xs font-bold text-white">
                    {item.step}
                  </span>
                  <span className="text-sm font-medium leading-relaxed text-slate-700">
                    {item.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ─── Support + Notice ─── */}
      <section className="relative overflow-hidden rounded-2xl border-2 border-slate-300/60 bg-gradient-to-r from-slate-50 via-white to-rose-50 p-5 shadow-lg shadow-slate-200/40 backdrop-blur md:p-6">
        <div className="pointer-events-none absolute -left-10 -top-10 h-24 w-24 rounded-full bg-slate-200/40 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 right-12 h-24 w-24 rounded-full bg-rose-200/30 blur-2xl" />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 rounded-xl bg-white/90 px-3 py-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral/10 text-coral">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Emergency Helpline</p>
              <p className="font-display text-3xl font-bold leading-none text-ink sm:text-4xl">1930</p>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 md:text-right">
            This is an academic demonstration project. For official cyber crime complaints in India, visit the{" "}
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ocean underline underline-offset-2 hover:text-ocean/80"
            >
              Government of India Cyber Crime Portal
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
