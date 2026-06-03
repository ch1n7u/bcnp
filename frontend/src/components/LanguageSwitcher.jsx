"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "portal_language";

function writeLanguageCookie(lang) {
  if (typeof document === "undefined") {
    return;
  }

  if (lang === "hi") {
    document.cookie = "googtrans=/en/hi; path=/; max-age=31536000";
    return;
  }

  document.cookie = "googtrans=; path=/; max-age=0";
}

function clearTranslationState() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  writeLanguageCookie("en");
}

function applyGoogleTranslate(lang) {
  if (typeof window === "undefined") return;

  const setCombo = () => {
    const combo = document.querySelector(".goog-te-combo");
    if (!combo) return false;
    try {
      combo.value = lang === "hi" ? "hi" : "en";
      combo.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    } catch (e) {
      return false;
    }
  };

  if (setCombo()) return Promise.resolve(true);

  return new Promise((resolve) => {
    const tryApply = () => {
      if (setCombo()) return resolve(true);
      resolve(false);
    };

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.onload = () => setTimeout(tryApply, 500);
      document.body.appendChild(script);
    } else {
      setTimeout(tryApply, 500);
    }
  });
}

export default function LanguageSwitcher() {
  const [activeLanguage, setActiveLanguage] = useState("en");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setActiveLanguage("en");
    window.localStorage.setItem(STORAGE_KEY, "en");
    writeLanguageCookie("en");
    clearTranslationState();
  }, []);

  const changeLanguage = (lang) => {
    if (lang === "en") {
      setActiveLanguage("en");
      clearTranslationState();
      window.location.reload();
      return;
    }

    setActiveLanguage(lang);
    window.localStorage.setItem(STORAGE_KEY, lang);
    writeLanguageCookie(lang);

    // Try to apply the language in-place using the Google widget. If that
    // fails within a short time window, fall back to a full reload.
    applyGoogleTranslate(lang).then((applied) => {
      if (applied) return;
      window.location.reload();
    });
  };

  return (
    <div className="language-toggle" role="group" aria-label="Language selector">
      <span className="language-toggle__label">Language</span>
      <button
        type="button"
        className={`language-toggle__button ${activeLanguage === "en" ? "language-toggle__button--active" : ""}`}
        onClick={() => changeLanguage("en")}
        aria-pressed={activeLanguage === "en"}
      >
        EN
      </button>
      <button
        type="button"
        className={`language-toggle__button ${activeLanguage === "hi" ? "language-toggle__button--active" : ""}`}
        onClick={() => changeLanguage("hi")}
        aria-pressed={activeLanguage === "hi"}
      >
        हिंदी
      </button>
      <div id="google_translate_element" aria-hidden="true" />
    </div>
  );
}