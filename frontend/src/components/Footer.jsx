import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-8 border-t border-ocean/20 bg-ocean/10 backdrop-blur md:mt-10">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center gap-2 md:justify-start">
            <Image src="/logo.svg" alt="Bharat Cyber Nyay Portal logo" width={30} height={30} />
            <h2 className="font-display text-lg font-bold text-ocean">
              <span className="notranslate" translate="no">Bharat Cyber Nyay Portal</span>
            </h2>
          </div>
          <p className="mt-2 text-sm text-slate-700">
            A secure platform for reporting cybercrime incidents and tracking case progress.
          </p>
        </div>

        <div className="text-center md:text-left">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Quick Links</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            <li>
              <Link href="/report" className="hover:text-ocean">
                File a Report
              </Link>
            </li>
            <li>
              <Link href="/track" className="hover:text-ocean">
                Track a Case
              </Link>
            </li>
            <li>
              <Link href="/resources" className="hover:text-ocean">
                Safety Resources
              </Link>
            </li>
          </ul>
        </div>

        <div className="text-center md:text-left">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">Emergency Help</h3>
          <p className="mt-2 text-sm text-slate-700">National Cyber Crime Helpline</p>
          <p className="font-display text-3xl font-bold text-coral">1930</p>
        </div>
      </div>

      <div className="border-t border-ocean/20 px-4 py-3 text-center text-xs leading-relaxed text-slate-600 sm:px-6 lg:px-8">
        <p className="mx-auto max-w-4xl">
          <span className="notranslate" translate="no">Bharat Cyber Nyay Portal</span> © {currentYear}. For official cybercrime complaints in India, please visit{" "}
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ocean underline underline-offset-2 hover:text-ocean/80"
          >
            cybercrime.gov.in
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
