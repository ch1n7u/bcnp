"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  const correlationId = error?.correlationId || error?.response?.data?.correlationId;

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl p-8 shadow-2xl border border-slate-200 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Critical Error</h1>
          <p className="mt-4 text-sm text-slate-600 leading-relaxed">
            An unexpected error occurred. Please try again later.
          </p>

          {correlationId && (
            <div className="mt-4 rounded-lg bg-slate-100 p-3 text-xs font-mono text-slate-500 border border-slate-200 select-all">
              Reference ID: <span className="font-bold text-slate-700">{correlationId}</span>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={() => reset()}
              className="w-full rounded-xl bg-[#0a6173] py-3.5 px-6 font-bold text-white shadow-lg hover:opacity-90 transition-all text-sm"
            >
              Refresh Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
