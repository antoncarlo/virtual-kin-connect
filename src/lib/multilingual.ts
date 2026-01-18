/**
 * Kindred AI - Professional Multilingual System
 * Handles voice mapping, language detection, and localization for VAPI + HeyGen
 */

export type SupportedLanguage = 'auto' | 'it' | 'en' | 'es' | 'fr' | 'de' | 'pt';

// Language metadata
export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  vapiLanguageCode: string;
  deepgramLanguage: string;
  elevenLabsModel: string;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  auto: {
    code: 'auto',
    name: 'Auto-detect',
    nativeName: 'Automatico',
    flag: '🌐',
    vapiLanguageCode: 'multi',
    deepgramLanguage: 'multi',
    elevenLabsModel: 'eleven_multilingual_v2',
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    vapiLanguageCode: 'it',
    deepgramLanguage: 'it',
    elevenLabsModel: 'eleven_multilingual_v2',
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    vapiLanguageCode: 'en',
    deepgramLanguage: 'en',
    elevenLabsModel: 'eleven_multilingual_v2',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    vapiLanguageCode: 'es',
    deepgramLanguage: 'es',
    elevenLabsModel: 'eleven_multilingual_v2',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    vapiLanguageCode: 'fr',
    deepgramLanguage: 'fr',
    elevenLabsModel: 'eleven_multilingual_v2',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    vapiLanguageCode: 'de',
    deepgramLanguage: 'de',
    elevenLabsModel: 'eleven_multilingual_v2',
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    vapiLanguageCode: 'pt',
    deepgramLanguage: 'pt',
    elevenLabsModel: 'eleven_multilingual_v2',
  },
};

// HeyGen voice IDs per language (Azure Neural Voices)
export interface HeyGenVoiceConfig {
  male: string;
  female: string;
}

export const HEYGEN_VOICES: Record<SupportedLanguage, HeyGenVoiceConfig> = {
  auto: { male: 'it-IT-DiegoNeural', female: 'it-IT-ElsaNeural' }, // Default to Italian
  it: { male: 'it-IT-DiegoNeural', female: 'it-IT-ElsaNeural' },
  en: { male: 'en-US-GuyNeural', female: 'en-US-JennyNeural' },
  es: { male: 'es-ES-AlvaroNeural', female: 'es-ES-ElviraNeural' },
  fr: { male: 'fr-FR-HenriNeural', female: 'fr-FR-DeniseNeural' },
  de: { male: 'de-DE-ConradNeural', female: 'de-DE-KatjaNeural' },
  pt: { male: 'pt-BR-AntonioNeural', female: 'pt-BR-FranciscaNeural' },
};

// ElevenLabs voice IDs for VAPI (TTS)
// Using multilingual v2 voices that support all languages
export interface ElevenLabsVoiceConfig {
  male: string;
  female: string;
  maleVoiceName: string;
  femaleVoiceName: string;
}

// ElevenLabs Multilingual v2 voices that sound natural in each language
export const ELEVENLABS_VOICES: Record<SupportedLanguage, ElevenLabsVoiceConfig> = {
  auto: {
    male: 'onwK4e9ZLuTAKqWW03F9', // Daniel - multilingual
    female: 'EXAVITQu4vr4xnSDxMaL', // Sarah - multilingual
    maleVoiceName: 'Daniel',
    femaleVoiceName: 'Sarah',
  },
  it: {
    male: 'onwK4e9ZLuTAKqWW03F9', // Daniel - sounds great in Italian
    female: 'EXAVITQu4vr4xnSDxMaL', // Sarah - multilingual
    maleVoiceName: 'Daniel',
    femaleVoiceName: 'Sarah',
  },
  en: {
    male: 'pNInz6obpgDQGcFmaJgB', // Adam - natural English
    female: '21m00Tcm4TlvDq8ikWAM', // Rachel - natural English
    maleVoiceName: 'Adam',
    femaleVoiceName: 'Rachel',
  },
  es: {
    male: 'onwK4e9ZLuTAKqWW03F9', // Daniel - multilingual
    female: 'EXAVITQu4vr4xnSDxMaL', // Sarah - multilingual
    maleVoiceName: 'Daniel',
    femaleVoiceName: 'Sarah',
  },
  fr: {
    male: 'onwK4e9ZLuTAKqWW03F9', // Daniel - multilingual
    female: 'EXAVITQu4vr4xnSDxMaL', // Sarah - multilingual
    maleVoiceName: 'Daniel',
    femaleVoiceName: 'Sarah',
  },
  de: {
    male: 'onwK4e9ZLuTAKqWW03F9', // Daniel - multilingual
    female: 'EXAVITQu4vr4xnSDxMaL', // Sarah - multilingual
    maleVoiceName: 'Daniel',
    femaleVoiceName: 'Sarah',
  },
  pt: {
    male: 'onwK4e9ZLuTAKqWW03F9', // Daniel - multilingual
    female: 'EXAVITQu4vr4xnSDxMaL', // Sarah - multilingual
    maleVoiceName: 'Daniel',
    femaleVoiceName: 'Sarah',
  },
};

// Get ElevenLabs voice ID for VAPI
export function getElevenLabsVoiceId(
  gender: 'male' | 'female',
  language: SupportedLanguage
): string {
  const lang = language === 'auto' ? 'it' : language;
  const voices = ELEVENLABS_VOICES[lang] || ELEVENLABS_VOICES.it;
  return gender === 'male' ? voices.male : voices.female;
}

// Get VAPI voice configuration for language and gender
export function getVapiVoiceConfig(
  gender: 'male' | 'female',
  language: SupportedLanguage
) {
  const voiceId = getElevenLabsVoiceId(gender, language);
  const langConfig = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.auto;

  return {
    provider: 'eleven-labs' as const,
    voiceId,
    model: 'eleven_multilingual_v2',
    language: langConfig.vapiLanguageCode,
  };
}

// HeyGen public avatars - matching gender to persona
export const HEYGEN_AVATARS = {
  // Male avatars
  MARCO: {
    avatarId: 'Bryan_IT_Sitting_public',
    gender: 'male' as const,
    style: 'casual',
  },
  // Female avatars - using proper female public avatar
  SOFIA: {
    avatarId: 'Anna_public', // Female avatar
    gender: 'female' as const,
    style: 'professional',
  },
  // Fallback avatars
  FALLBACK_MALE: {
    avatarId: 'Wayne_20240711',
    gender: 'male' as const,
    style: 'neutral',
  },
  FALLBACK_FEMALE: {
    avatarId: 'Kristin_public',
    gender: 'female' as const,
    style: 'neutral',
  },
} as const;

// Welcome messages per language
export const WELCOME_MESSAGES: Record<SupportedLanguage, string[]> = {
  auto: [
    "Ciao! Che bello vederti!",
    "Ehi, eccoti finalmente! Come stai?",
    "Hey! Sono contento di parlarti faccia a faccia!",
  ],
  it: [
    "Ciao! Che bello vederti!",
    "Ehi, eccoti finalmente! Come stai?",
    "Hey! Sono contento di parlarti faccia a faccia!",
  ],
  en: [
    "Hi! So nice to see you!",
    "Hey, there you are! How are you?",
    "Hey! I'm happy to talk to you face to face!",
  ],
  es: [
    "¡Hola! ¡Qué bueno verte!",
    "¡Hey, por fin! ¿Cómo estás?",
    "¡Hey! ¡Me alegra hablar contigo cara a cara!",
  ],
  fr: [
    "Salut! C'est super de te voir!",
    "Hey, te voilà enfin! Comment vas-tu?",
    "Hey! Je suis content de te parler en face!",
  ],
  de: [
    "Hallo! Schön dich zu sehen!",
    "Hey, da bist du ja! Wie geht's dir?",
    "Hey! Schön, mit dir von Angesicht zu Angesicht zu sprechen!",
  ],
  pt: [
    "Oi! Que bom te ver!",
    "Ei, finalmente! Como você está?",
    "Ei! Estou feliz em falar com você cara a cara!",
  ],
};

// Advanced language detection with confidence scoring
export interface LanguageDetectionResult {
  language: SupportedLanguage;
  confidence: number;
  patterns: string[];
}

const LANGUAGE_PATTERNS: Record<SupportedLanguage, { patterns: RegExp[]; weight: number }> = {
  auto: { patterns: [], weight: 0 },
  it: {
    patterns: [
      /\b(ciao|come|stai|sono|vorrei|grazie|buongiorno|perché|cosa|quando|dove|chi|quale|quanto)\b/gi,
      /\b(ho|hai|ha|abbiamo|avete|hanno|sto|stai|sta)\b/gi,
      /\b(bene|male|così|molto|poco|tanto|tutto|niente|nulla)\b/gi,
      /\b(mi|ti|ci|vi|si|lo|la|li|le|gli|ne)\b/gi,
    ],
    weight: 1.0,
  },
  en: {
    patterns: [
      /\b(hello|hi|hey|how|are|you|want|thanks|good|morning|why|what|when|where|who)\b/gi,
      /\b(have|has|had|do|does|did|am|is|are|was|were)\b/gi,
      /\b(the|a|an|this|that|these|those|my|your|his|her|its|our|their)\b/gi,
      /\b(I|you|he|she|it|we|they|me|him|her|us|them)\b/gi,
    ],
    weight: 1.0,
  },
  es: {
    patterns: [
      /\b(hola|como|estas|soy|quiero|gracias|buenos|días|porque|que|cuando|donde|quien)\b/gi,
      /\b(tengo|tienes|tiene|tenemos|tienen|estoy|estas|está|estamos|están)\b/gi,
      /\b(el|la|los|las|un|una|unos|unas|mi|tu|su|nuestro)\b/gi,
      /\b(yo|tú|él|ella|nosotros|ellos|me|te|le|nos|les)\b/gi,
    ],
    weight: 1.0,
  },
  fr: {
    patterns: [
      /\b(bonjour|salut|comment|allez|suis|voudrais|merci|pourquoi|quoi|quand|où|qui)\b/gi,
      /\b(ai|as|a|avons|avez|ont|suis|es|est|sommes|êtes|sont)\b/gi,
      /\b(le|la|les|un|une|des|mon|ton|son|notre|votre|leur)\b/gi,
      /\b(je|tu|il|elle|nous|vous|ils|elles|me|te|se|lui)\b/gi,
    ],
    weight: 1.0,
  },
  de: {
    patterns: [
      /\b(hallo|wie|geht|bin|möchte|danke|guten|morgen|warum|was|wann|wo|wer)\b/gi,
      /\b(habe|hast|hat|haben|habt|bin|bist|ist|sind|seid)\b/gi,
      /\b(der|die|das|ein|eine|mein|dein|sein|ihr|unser|euer)\b/gi,
      /\b(ich|du|er|sie|es|wir|ihr|mich|dich|sich|uns|euch)\b/gi,
    ],
    weight: 1.0,
  },
  pt: {
    patterns: [
      /\b(olá|oi|como|está|sou|quero|obrigado|bom|dia|porque|que|quando|onde|quem)\b/gi,
      /\b(tenho|tens|tem|temos|têm|estou|estás|está|estamos|estão)\b/gi,
      /\b(o|a|os|as|um|uma|uns|umas|meu|teu|seu|nosso)\b/gi,
      /\b(eu|tu|ele|ela|nós|eles|elas|me|te|se|nos|lhe|lhes)\b/gi,
    ],
    weight: 1.0,
  },
};

export function detectLanguage(text: string): LanguageDetectionResult {
  if (!text || text.length < 5) {
    return { language: 'auto', confidence: 0, patterns: [] };
  }

  const results: { lang: SupportedLanguage; score: number; matched: string[] }[] = [];
  const normalizedText = text.toLowerCase();

  for (const [lang, config] of Object.entries(LANGUAGE_PATTERNS)) {
    if (lang === 'auto') continue;

    let score = 0;
    const matchedPatterns: string[] = [];

    for (const pattern of config.patterns) {
      const matches = normalizedText.match(pattern);
      if (matches) {
        score += matches.length * config.weight;
        matchedPatterns.push(...matches.slice(0, 3));
      }
    }

    if (score > 0) {
      results.push({
        lang: lang as SupportedLanguage,
        score,
        matched: [...new Set(matchedPatterns)],
      });
    }
  }

  if (results.length === 0) {
    return { language: 'auto', confidence: 0, patterns: [] };
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  const best = results[0];
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const confidence = Math.min(best.score / Math.max(totalScore, 1), 1);

  return {
    language: best.lang,
    confidence,
    patterns: best.matched,
  };
}

// Get HeyGen voice ID for avatar and language
export function getHeyGenVoiceId(
  gender: 'male' | 'female',
  language: SupportedLanguage
): string {
  const lang = language === 'auto' ? 'it' : language;
  const voices = HEYGEN_VOICES[lang] || HEYGEN_VOICES.it;
  return gender === 'male' ? voices.male : voices.female;
}

// Get welcome message for language
export function getWelcomeMessage(language: SupportedLanguage): string {
  const messages = WELCOME_MESSAGES[language] || WELCOME_MESSAGES.it;
  return messages[Math.floor(Math.random() * messages.length)];
}

// Get VAPI transcriber config for language
export function getVapiTranscriberConfig(language: SupportedLanguage) {
  const langConfig = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.auto;

  return {
    provider: "deepgram" as const,
    model: "nova-2-general",
    language: langConfig.deepgramLanguage,
    smartFormat: true,
  };
}

// Browser language detection
export function getBrowserLanguage(): SupportedLanguage {
  if (typeof navigator === 'undefined') return 'en';

  const browserLang = navigator.language?.split('-')[0]?.toLowerCase();

  if (browserLang && browserLang in SUPPORTED_LANGUAGES) {
    return browserLang as SupportedLanguage;
  }

  return 'en';
}

// Session storage helpers for language persistence
const LANGUAGE_STORAGE_KEY = 'kindred_detected_language';
const LANGUAGE_PREFERENCE_KEY = 'kindred_language_preference';

export function saveDetectedLanguage(language: SupportedLanguage): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }
}

export function getStoredLanguage(): SupportedLanguage | null {
  if (typeof sessionStorage !== 'undefined') {
    const stored = sessionStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && stored in SUPPORTED_LANGUAGES) {
      return stored as SupportedLanguage;
    }
  }
  return null;
}

export function saveLanguagePreference(language: SupportedLanguage): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LANGUAGE_PREFERENCE_KEY, language);
  }
}

export function getLanguagePreference(): SupportedLanguage | null {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(LANGUAGE_PREFERENCE_KEY);
    if (stored && stored in SUPPORTED_LANGUAGES) {
      return stored as SupportedLanguage;
    }
  }
  return null;
}
