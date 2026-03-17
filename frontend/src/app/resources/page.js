"use client";

import { useState } from "react";

/* ─── Structured Data ─── */

const categories = [
  {
    id: "financial",
    title: "Financial Fraud Safety",
    color: "ocean",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    tips: [
      "Never share OTP, UPI PIN, or CVV with anyone — banks never ask for these.",
      "Always verify the UPI ID or account details before sending money.",
      "Avoid using screen-sharing apps (AnyDesk, TeamViewer) during bank-related calls.",
      "Beware of fake 'KYC update' calls or SMS claiming your account will be blocked.",
      "Do not click on unknown payment links received via SMS, WhatsApp, or email.",
      "Report suspicious transactions to your bank immediately within the golden hour.",
    ],
  },
  {
    id: "phishing",
    title: "Phishing & Fake Websites",
    color: "coral",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    tips: [
      "Always check for HTTPS and verify the domain spelling before entering credentials.",
      "Avoid clicking shortened or suspicious URLs from unknown sources.",
      "Do not download attachments from unknown or unexpected emails.",
      "Verify the sender's email domain carefully — scammers often mimic official domains.",
      "Government websites always end with .gov.in — verify before sharing info.",
      "Hover over links to preview the actual URL before clicking.",
    ],
  },
  {
    id: "social",
    title: "Social Media Safety",
    color: "ocean",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    tips: [
      "Do not share personal information (Aadhaar, PAN, phone number) publicly.",
      "Beware of fake job offers or loan approvals on social media.",
      "Report impersonation accounts immediately to the platform.",
      "Enable privacy settings — restrict who can see your posts and personal info.",
      "Avoid accepting friend/follow requests from unknown profiles.",
      "Never send money to someone you have only met online.",
    ],
  },
  {
    id: "password",
    title: "Password & Account Security",
    color: "coral",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    tips: [
      "Use strong, unique passwords with a mix of letters, numbers, and symbols.",
      "Enable 2-factor authentication (2FA) on all important accounts.",
      "Do not reuse the same password across multiple sites.",
      "Use a reputable password manager to store credentials securely.",
      "Change passwords immediately if you suspect an account breach.",
      "Never share your password with friends, family, or support agents.",
    ],
  },
  {
    id: "device",
    title: "Device & App Security",
    color: "ocean",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    tips: [
      "Install apps only from official stores (Google Play Store / Apple App Store).",
      "Keep your operating system and apps updated to patch vulnerabilities.",
      "Avoid using public Wi-Fi for banking or financial transactions.",
      "Use a reputable antivirus / anti-malware software on all devices.",
      "Disable Bluetooth and Wi-Fi when not in use in public places.",
      "Review app permissions regularly and revoke unnecessary access.",
    ],
  },
  {
    id: "reporting",
    title: "Reporting & Response",
    color: "coral",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    tips: [
      "Report fraud immediately — the 'golden hour' is critical for fund recovery.",
      "Contact your bank helpline to block cards and freeze suspicious transactions.",
      "Capture screenshots and preserve all evidence (chats, emails, transaction IDs).",
      "File an official complaint on the national cybercrime portal (cybercrime.gov.in).",
      "Dial 1930 (National Cyber Crime Helpline) for immediate assistance.",
      "Keep a written record of all communications with your bank and authorities.",
    ],
  },
];

const emergencySteps = [
  {
    step: "1",
    title: "Block Your Account",
    desc: "Call your bank immediately and request to freeze your account or block your card.",
  },
  {
    step: "2",
    title: "Call 1930 Helpline",
    desc: "Dial the National Cyber Crime Helpline for immediate guidance and assistance.",
  },
  {
    step: "3",
    title: "Report on Portal",
    desc: "File a complaint at cybercrime.gov.in or on this portal with full details.",
  },
  {
    step: "4",
    title: "Preserve Evidence",
    desc: "Screenshot chats, save emails, note transaction IDs, and do not delete anything.",
  },
];

const scamExamples = [
  {
    title: "Fake KYC Update Call",
    desc: "Scammer impersonates a bank official and asks you to download a screen-sharing app to 'update KYC'. They then access your banking app remotely.",
  },
  {
    title: "OLX / Marketplace Buyer Scam",
    desc: "A fake buyer claims to be an army officer and sends a QR code or UPI request, asking you to 'receive' money — but the request actually debits your account.",
  },
  {
    title: "Job Scam with Registration Fees",
    desc: "Fraudsters post fake job listings and ask candidates to pay 'registration', 'training', or 'security deposit' fees before onboarding. Legitimate companies never charge applicants.",
  },
  {
    title: "Lottery / Prize Scam",
    desc: "You receive a message saying you've won a lottery or prize. To claim it, you must pay 'tax' or 'processing fees'. No legitimate lottery asks winners to pay in order to claim their prize.",
  },
  {
    title: "Remote Access App Scam",
    desc: "Caller convinces you to install AnyDesk or TeamViewer for 'tech support' or 'refund processing', then takes control of your device and initiates unauthorized transactions.",
  },
];

/* ─── Accordion Component ─── */

function CategoryAccordion({ category, isOpen, toggle }) {
  const borderColor = category.color === "ocean" ? "border-ocean/30" : "border-coral/30";
  const iconBg = category.color === "ocean" ? "bg-ocean/10 text-ocean" : "bg-coral/10 text-coral";
  const titleColor = category.color === "ocean" ? "text-ocean" : "text-coral";

  return (
    <div
      className={`glass overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-lg ${borderColor}`}
    >
      <button
        onClick={toggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-white/40"
        aria-expanded={isOpen}
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          {category.icon}
        </span>
        <span className={`font-display text-lg font-bold ${titleColor}`}>{category.title}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`ml-auto h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <ul className="space-y-2 px-5 pb-5 pt-1">
            {category.tips.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl bg-white/60 px-4 py-3 text-sm leading-relaxed text-slate-700 transition hover:bg-white/90"
              >
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${category.color === "ocean" ? "bg-ocean" : "bg-coral"}`}>
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function ResourcesPage() {
  const [openIds, setOpenIds] = useState(["financial"]);

  const toggle = (id) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-12 md:space-y-10 md:pb-16">
      {/* ─── Header ─── */}
      <section className="text-center">
        <p className="mb-3 inline-flex rounded-full bg-surf px-4 py-1 text-sm font-bold text-ocean">
          Stay Safe Online
        </p>
        <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">
          Cyber Awareness Resources
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Comprehensive, practical tips to protect yourself from cyber crimes in
          India. Browse by category or scroll through to learn how to stay safe.
        </p>
      </section>

      {/* ─── Emergency Actions ─── */}
      <section className="relative overflow-hidden rounded-2xl border-2 border-red-300 bg-gradient-to-br from-red-50 via-white to-red-50 p-5 shadow-lg md:p-8">
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-red-200/40 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-red-200/30 blur-2xl" />

        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </span>
          <h2 className="font-display text-xl font-bold text-red-700 sm:text-2xl">
            Emergency Actions — If You&apos;ve Been Scammed
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {emergencySteps.map((item) => (
            <div
              key={item.step}
              className="group relative flex h-full flex-col rounded-xl border border-red-200 bg-white/80 p-4 transition hover:border-red-400 hover:shadow-md"
            >
              <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white">
                {item.step}
              </span>
              <h3 className="font-display text-base font-bold text-red-800">
                {item.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-red-700/80">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Categories Accordion ─── */}
      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-2xl font-bold text-ink">
            Safety Tips by Category
          </h2>
          <button
            onClick={() =>
              setOpenIds((prev) =>
                prev.length === categories.length
                  ? []
                  : categories.map((c) => c.id)
              )
            }
            className="rounded-lg border border-ocean/30 px-3 py-1.5 text-xs font-semibold text-ocean transition hover:bg-ocean/10"
          >
            {openIds.length === categories.length ? "Collapse All" : "Expand All"}
          </button>
        </div>

        <div className="grid gap-4">
          {categories.map((cat) => (
            <CategoryAccordion
              key={cat.id}
              category={cat}
              isOpen={openIds.includes(cat.id)}
              toggle={() => toggle(cat.id)}
            />
          ))}
        </div>
      </section>

      {/* ─── Common Scam Examples ─── */}
      <section>
        <h2 className="mb-5 font-display text-2xl font-bold text-ink">
          Common Scam Examples
        </h2>
        <p className="mb-5 text-sm text-slate-600">
          Real-world fraud scenarios reported frequently in India. Knowing these
          patterns helps you recognize and avoid them.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scamExamples.map((scam, i) => (
            <div
              key={i}
              className="glass group flex h-full flex-col rounded-2xl border border-coral/20 p-5 transition-all duration-300 hover:border-coral/50 hover:shadow-lg"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-coral/10 text-coral">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                <h3 className="font-display text-base font-bold text-ink group-hover:text-coral transition-colors">
                  {scam.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                {scam.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Helpline Footer ─── */}
      <section className="glass rounded-2xl border border-ocean/20 p-6 text-center">
        <h2 className="font-display text-xl font-bold text-ocean">
          National Cyber Crime Helpline
        </h2>
        <p className="mt-2 font-display text-4xl font-bold text-ink">1930</p>
      </section>
    </div>
  );
}
