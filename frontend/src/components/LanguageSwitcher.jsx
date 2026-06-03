"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "portal_language";

function readCookieLanguage() {
  if (typeof document === "undefined") {
    return "en";
  }

  const value = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("googtrans="));

  if (!value) {
    return "en";
  }

  return value.includes("/hi") ? "hi" : "en";
}

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

export default function LanguageSwitcher() {
  const [activeLanguage, setActiveLanguage] = useState("en");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const persisted = window.localStorage.getItem(STORAGE_KEY);
    const currentLanguage =
      persisted === "en" || persisted === "hi"
        ? persisted
        : readCookieLanguage();

    const languageToApply = currentLanguage === "hi" ? "hi" : "en";
    setActiveLanguage(languageToApply);
    window.localStorage.setItem(STORAGE_KEY, languageToApply);
    writeLanguageCookie(languageToApply);

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) {
        return;
      }

      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,hi",
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
        },
        "google_translate_element"
      );
    };

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    }
  }, []);

  const changeLanguage = (lang) => {
    if (lang === activeLanguage) {
      return;
    }

    setActiveLanguage(lang);
    window.localStorage.setItem(STORAGE_KEY, lang);
    writeLanguageCookie(lang);

    // Reload ensures Google applies translation consistently across all pages.
    window.location.reload();
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