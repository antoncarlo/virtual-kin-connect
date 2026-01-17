import { useState, useCallback, useEffect } from "react";
import { 
  SupportedLanguage, 
  detectLanguageFromText, 
  getBrowserLanguage,
  getTranslations,
  Translations 
} from "@/lib/i18n";

interface UseLanguageReturn {
  language: SupportedLanguage;
  translations: Translations;
  setLanguage: (lang: SupportedLanguage) => void;
  detectFromMessage: (text: string) => void;
  isAutoDetected: boolean;
}

export function useLanguage(): UseLanguageReturn {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    // Try to get saved preference from localStorage
    const saved = localStorage.getItem("kindred_language");
    if (saved && saved !== "auto") {
      return saved as SupportedLanguage;
    }
    return "auto";
  });
  
  const [detectedLanguage, setDetectedLanguage] = useState<SupportedLanguage>(() => 
    getBrowserLanguage()
  );
  const [isAutoDetected, setIsAutoDetected] = useState(language === "auto");

  // Get the effective language (auto resolves to detected/browser language)
  const effectiveLanguage = language === "auto" ? detectedLanguage : language;
  const translations = getTranslations(effectiveLanguage);

  // Set language manually
  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    setIsAutoDetected(lang === "auto");
    
    if (lang !== "auto") {
      localStorage.setItem("kindred_language", lang);
    } else {
      localStorage.removeItem("kindred_language");
    }
  }, []);

  // Detect language from user message
  const detectFromMessage = useCallback((text: string) => {
    if (text.length < 10) return; // Don't detect from very short messages
    
    const detected = detectLanguageFromText(text);
    if (detected !== "auto" && detected !== detectedLanguage) {
      console.log(`Language detected: ${detected} (was: ${detectedLanguage})`);
      setDetectedLanguage(detected);
      setIsAutoDetected(true);
      
      // Save detected language for session continuity
      sessionStorage.setItem("kindred_detected_language", detected);
    }
  }, [detectedLanguage]);

  // On mount, check for session-stored detected language
  useEffect(() => {
    const sessionDetected = sessionStorage.getItem("kindred_detected_language");
    if (sessionDetected && language === "auto") {
      setDetectedLanguage(sessionDetected as SupportedLanguage);
    }
  }, [language]);

  return {
    language: effectiveLanguage,
    translations,
    setLanguage,
    detectFromMessage,
    isAutoDetected,
  };
}
