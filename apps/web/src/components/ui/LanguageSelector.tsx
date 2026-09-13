"use client";

import React from "react";
import { useLanguageStore, LanguageCode } from "@/lib/i18n";
import { Languages } from "lucide-react";

const LANGUAGES: { code: LanguageCode; label: string; nativeName: string }[] = [
  { code: "en", label: "English", nativeName: "EN" },
  { code: "hi", label: "Hindi", nativeName: "हिंदी" },
  { code: "as", label: "Assamese", nativeName: "অসমীয়া" },
  { code: "bn", label: "Bengali", nativeName: "বাংলা" },
];

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage } = useLanguageStore();

  return (
    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 rounded-xl p-0.5 text-xs shadow-xs">
      <Languages className="w-3.5 h-3.5 text-slate-400 ml-2 shrink-0" />
      <select
        value={currentLanguage}
        onChange={(e) => setLanguage(e.target.value as LanguageCode)}
        className="bg-transparent border-0 text-slate-700 font-medium focus:ring-0 text-xs py-1 pl-1 pr-2 cursor-pointer focus:outline-none"
        aria-label="Select Language"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-white text-slate-800">
            {lang.nativeName} ({lang.label})
          </option>
        ))}
      </select>
    </div>
  );
};

