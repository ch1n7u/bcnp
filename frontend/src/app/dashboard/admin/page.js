"use client";

import Link from "next/link";
import ProtectedRoute from "../../../components/ProtectedRoute";

function ActionCard({ href, title, description, accent, cta }) {
  return (
    <Link href={href} className="group flex h-full flex-col rounded-3xl border border-white/60 bg-white/80 p-5 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl sm:p-6">
      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${accent}`}>{cta}</div>
      <h2 className="mt-4 font-display text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <div className="mt-auto pt-6 text-sm font-semibold text-ocean">Open section</div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowRoles={["admin"]}>
      <section className="space-y-6">
        <div className="glass rounded-3xl p-5 shadow-xl sm:p-8">
          <p className="inline-flex rounded-full bg-surf px-4 py-1 text-sm font-bold text-ocean">Administration Center</p>
          <h1 className="mt-4 font-display text-3xl font-bold text-slate-900 md:text-4xl">Admin Control Panel</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-600">
            Use the sections below to manage case assignment, investigator accounts, and the broader reporting workflow without crowding a single page.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            href="/dashboard/admin/cases"
            title="Case Assignment"
            description="Review reports, assign investigators, update case status, and add notes from a focused workflow."
            accent="bg-ocean/10 text-ocean"
            cta="Cases"
          />
          <ActionCard
            href="/dashboard/admin/investigators"
            title="Investigators"
            description="See all investigators, create accounts, check workload and availability, edit profiles, and remove investigators when needed."
            accent="bg-green-100 text-green-700"
            cta="Team"
          />
          <ActionCard
            href="/dashboard/admin/users"
            title="Registered Users"
            description="Review all registered citizens on the platform and seamlessly delete invalid, abusive, or duplicate accounts."
            accent="bg-purple-100 text-purple-700"
            cta="Users"
          />
        </div>
      </section>
    </ProtectedRoute>
  );
}
