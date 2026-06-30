"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { Language, translations } from "./i18n"

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")

  // Load language preference from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("crm_language") as Language
    if (savedLang && (savedLang === "en" || savedLang === "hi" || savedLang === "gu")) {
      setLanguageState(savedLang)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("crm_language", lang)
    // Dispatch custom event to notify other components/layouts if needed
    window.dispatchEvent(new Event("languagechange"))
  }

  const t = (key: string): string => {
    const dict = translations[language] || translations["en"]
    return dict[key] || translations["en"][key] || key
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    // Graceful fallback for components outside provider during tests/renders
    return {
      language: "en" as Language,
      setLanguage: () => {},
      t: (key: string) => {
        const dict = translations["en"]
        return dict[key] || key
      }
    }
  }
  return context
}
