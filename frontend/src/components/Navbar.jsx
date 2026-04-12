"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const isInvestigator = user?.role === "investigator";
  const isCitizen = user?.role === "citizen";
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isAdminSection = pathname?.startsWith("/dashboard/admin") || pathname?.startsWith("/dashboard/analytics");

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const baseLinkClass = "block w-full rounded-lg px-3 py-2 text-left text-slate-700 transition hover:bg-white/70 hover:text-ocean md:w-auto md:px-3.5 md:py-2 md:text-center";
  const activeLinkClass = "block w-full rounded-lg bg-ocean/10 px-3 py-2 text-left text-ocean md:w-auto md:px-3.5 md:py-2 md:text-center";

  const getLinkClass = (href, exact = false) => {
    const active = exact ? pathname === href : pathname === href || pathname?.startsWith(`${href}/`);
    return active ? activeLinkClass : baseLinkClass;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ocean/20 bg-ocean/10 backdrop-blur-md">
      <nav className="mx-auto flex w-full max-w-7xl flex-col px-4 py-2.5 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-4 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 font-display text-base font-bold text-ocean sm:text-lg md:text-xl">
            <Image src="/logo.svg" alt="Bharat Cyber Nyay Portal logo" width={34} height={34} priority className="h-8 w-8 shrink-0" />
            <span className="notranslate truncate" translate="no">Bharat Cyber Nyay Portal</span>
          </Link>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white/85 px-3 py-2 text-slate-700 md:hidden"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d={isMenuOpen ? "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" : "M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm1 4a1 1 0 100 2h12a1 1 0 100-2H4z"}
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className={`${isMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"} overflow-hidden transition-all duration-300 md:max-h-none md:flex-1 md:opacity-100`}>
          <div className="mt-2 flex flex-col gap-2 border-t border-white/60 pt-2 text-sm font-semibold md:mt-0 md:flex-row md:flex-wrap md:items-center md:justify-end md:gap-2 md:border-0 md:pt-0">
            <div className="w-fit">
              <LanguageSwitcher />
            </div>

            <Link href="/" className={getLinkClass("/", true)}>Home Page</Link>

            {!isAuthenticated && pathname !== "/resources" && !isAuthPage && (
              <Link href="/resources" className={getLinkClass("/resources", true)}>
                Resources
              </Link>
            )}

            {isCitizen && (
              <>
                <Link href="/track" className={getLinkClass("/track", true)}>Track</Link>
                <Link href="/resources" className={getLinkClass("/resources", true)}>Resources</Link>
                <Link href="/profile" className={getLinkClass("/profile", true)}>Profile</Link>
              </>
            )}

            {isInvestigator && (
              <>
                <Link href="/track" className={getLinkClass("/track", true)}>Track</Link>
                <Link href="/dashboard" className={getLinkClass("/dashboard", true)}>Dashboard</Link>
                <Link href="/profile" className={getLinkClass("/profile", true)}>Profile</Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link href="/dashboard/admin" className={getLinkClass("/dashboard/admin", true)}>Admin Home</Link>
                <Link href="/dashboard/admin/cases" className={getLinkClass("/dashboard/admin/cases", true)}>Case Assignment</Link>
                <Link href="/dashboard/admin/investigators" className={getLinkClass("/dashboard/admin/investigators", true)}>Investigators</Link>
                <Link href="/dashboard/analytics" className={getLinkClass("/dashboard/analytics", true)}>Analytics</Link>
              </>
            )}

            {!isAuthenticated ? (
              <>
                {pathname !== "/login" && <Link href="/login" className={getLinkClass("/login", true)}>Login</Link>}
                {pathname !== "/register" && (
                  <Link href="/register" className="w-full rounded-lg bg-ocean px-3.5 py-2 text-center text-white shadow-sm transition hover:bg-ocean/90 md:w-auto md:py-2 md:text-left">
                    Register
                  </Link>
                )}
              </>
            ) : (
              <>
                <span className="w-full truncate rounded-lg bg-ocean/10 px-3.5 py-2 text-ocean md:w-auto md:py-2" title={user?.email || ""}>
                  Logged in as {user?.name || (isInvestigator ? "Investigator" : isAdmin ? "Admin" : "Citizen")}
                </span>
                <button
                  onClick={logout}
                  className="w-full rounded-lg bg-coral px-3.5 py-2 text-white transition hover:bg-coral/90 md:w-auto md:py-2"
                  title={user?.email || ""}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
