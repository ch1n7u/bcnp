import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <div className="glass max-w-md w-full rounded-2xl p-8 shadow-2xl border border-white/60 animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-coral/10 text-coral">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="font-display text-4xl font-extrabold text-slate-800 tracking-tight">404</h1>
        <h2 className="mt-2 text-xl font-bold text-slate-700">Page Not Found</h2>
        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          Unable to process your request. The page you are looking for might have been moved or does not exist.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-block w-full rounded-xl bg-ocean py-3.5 px-6 font-bold text-white shadow-lg shadow-ocean/20 hover:bg-ocean/90 transition-all"
          >
            Go back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
