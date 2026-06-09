"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import api from "../lib/api";

export default function PageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef("");
  const visitStartTimeRef = useRef(0);

  useEffect(() => {
    if (!pathname) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    const referrer = lastPathRef.current || document.referrer;
    lastPathRef.current = url;

    // Track page leave duration if we navigated from another page in SPA
    let timeSpent = 0;
    if (visitStartTimeRef.current > 0) {
      timeSpent = Math.floor((Date.now() - visitStartTimeRef.current) / 1000);
    }
    visitStartTimeRef.current = Date.now();

    const trackVisit = async () => {
      try {
        await api.post("/track/page", {
          pageUrl: window.location.href,
          pageName: document.title || pathname,
          route: pathname,
          referrer,
          timeSpent
        }, {
          // We don't want tracking failures to throw global errors
          validateStatus: () => true 
        });
      } catch (err) {
        console.error("Failed to track page visit", err);
      }
    };

    trackVisit();

    // Setup beforeunload to track duration on the last page before closing tab
    const handleBeforeUnload = () => {
      const finalTimeSpent = Math.floor((Date.now() - visitStartTimeRef.current) / 1000);
      // We can use sendBeacon for reliable delivery on close, but we'd need full endpoint URL
      // Instead, we just rely on standard fetch here, which might get cancelled but it's a best effort
      if (finalTimeSpent > 0) {
         fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/track/page`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             pageUrl: window.location.href,
             pageName: document.title || pathname,
             route: pathname,
             referrer,
             timeSpent: finalTimeSpent
           }),
           keepalive: true
         }).catch(() => {});
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };

  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
}
