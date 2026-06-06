"use client";
import { useState, useEffect } from "react";

export default function DisclaimerOverlay() {
  const [show, setShow] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check if the user has already acknowledged the disclaimer in this session
    const hasAcknowledged = sessionStorage.getItem("bcnp_disclaimer_acknowledged");
    if (!hasAcknowledged) {
      setShow(true);
      // Disable scrolling on the body while the modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const handleAcknowledge = () => {
    setIsClosing(true);
    sessionStorage.setItem("bcnp_disclaimer_acknowledged", "true");
    
    // Allow animation to finish before unmounting
    setTimeout(() => {
      setShow(false);
      document.body.style.overflow = "auto";
    }, 300);
  };

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${
        isClosing ? "opacity-0 backdrop-blur-none" : "opacity-100 backdrop-blur-md bg-slate-900/40"
      }`}
    >
      <div 
        className={`w-full max-w-md transform rounded-3xl bg-white p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.4)] transition-all duration-300 ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {/* Top Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="mb-3 text-2xl font-bold tracking-tight text-slate-900">
          University Project Disclaimer
        </h2>

        {/* Message */}
        <div className="mb-8 space-y-4 text-base text-slate-600">
          <p>
            This is an independent portal made purely as a university academic project. It is <strong>not</strong> affiliated with the Government of India.
          </p>
          <p className="rounded-xl bg-slate-100 p-4 text-sm">
            For reporting any official Cyber Crime, please visit the official government website at: <br />
            <a 
              href="https://cybercrime.gov.in" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mt-1 inline-block font-bold text-blue-600 hover:underline"
            >
              cybercrime.gov.in
            </a>
          </p>
        </div>

        {/* Acknowledge Button */}
        <button
          onClick={handleAcknowledge}
          className="w-full rounded-2xl bg-[#507d77] px-4 py-3.5 text-base font-bold text-white shadow-md transition-colors hover:bg-[#3e6661] focus:outline-none focus:ring-2 focus:ring-[#507d77] focus:ring-offset-2"
        >
          I Acknowledge
        </button>
      </div>
    </div>
  );
}
