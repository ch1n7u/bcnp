"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Prevent sensitive trace exposure in client console logs in production
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  const correlationId = error?.correlationId || error?.response?.data?.correlationId;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="glass max-w-md w-full rounded-2xl p-8 shadow-2xl border border-white/60 animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-coral/10 text-coral">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-800 tracking-tight">System Error</h1>
        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          An unexpected error occurred. Please try again later.
        </p>

        {correlationId && (
          <div className="mt-4 rounded-lg bg-slate-100/80 p-3 text-xs font-mono text-slate-500 border border-slate-200 select-all">
            Reference ID: <span className="font-bold text-slate-700">{correlationId}</span>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 rounded-xl bg-ocean py-3 px-4 font-bold text-white shadow-lg shadow-ocean/20 hover:bg-ocean/90 transition-all text-sm"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="flex-1 rounded-xl bg-slate-200 py-3 px-4 font-bold text-slate-700 hover:bg-slate-300 transition-all text-sm"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
