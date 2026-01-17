// Multilingual support system for Kindred
// Auto-detects and adapts to user's language

export type SupportedLanguage = "it" | "en" | "es" | "fr" | "de" | "pt" | "auto";

export interface Translations {
  // Chat UI
  messagePlaceholder: string;
  callButton: string;
  endCallButton: string;
  videoButton: string;
  listening: string;
  
  // Call status
  callEnded: string;
  callEndedDesc: string;
  connected: string;
  connectedDesc: string;
  connectionError: string;
  
  // Chat actions
  clearHistory: string;
  historyCleared: string;
  analyzing: string;
  sessionTooShort: string;
  
  // Premium
  premiumOnly: string;
  premiumMemories: string;
  
  // Errors
  error: string;
  tryAgain: string;
  sessionExpired: string;
  pleaseLogin: string;
  
  // General
  loading: string;
  send: string;
  cancel: string;
  confirm: string;
  save: string;
  delete: string;
}

const translations: Record<SupportedLanguage, Translations> = {
  it: {
    messagePlaceholder: "Scrivi un messaggio...",
    callButton: "Chiama",
    endCallButton: "Termina chiamata",
    videoButton: "Video",
    listening: "Ascoltando...",
    callEnded: "Chiamata terminata",
    callEndedDesc: "La sessione è stata chiusa correttamente.",
    connected: "Connesso!",
    connectedDesc: "Stai parlando con",
    connectionError: "Errore di connessione",
    clearHistory: "Cancella cronologia",
    historyCleared: "Cronologia cancellata",
    analyzing: "Analizzando la sessione...",
    sessionTooShort: "Continua a chattare per permettermi di conoscerti meglio.",
    premiumOnly: "Funzione Premium",
    premiumMemories: "I ricordi condivisi sono riservati agli utenti Premium.",
    error: "Errore",
    tryAgain: "Riprova",
    sessionExpired: "Sessione scaduta",
    pleaseLogin: "Per favore effettua nuovamente il login.",
    loading: "Caricamento...",
    send: "Invia",
    cancel: "Annulla",
    confirm: "Conferma",
    save: "Salva",
    delete: "Elimina",
  },
  en: {
    messagePlaceholder: "Type a message...",
    callButton: "Call",
    endCallButton: "End Call",
    videoButton: "Video",
    listening: "Listening...",
    callEnded: "Call ended",
    callEndedDesc: "The session has been closed successfully.",
    connected: "Connected!",
    connectedDesc: "You're speaking with",
    connectionError: "Connection error",
    clearHistory: "Clear history",
    historyCleared: "History cleared",
    analyzing: "Analyzing session...",
    sessionTooShort: "Keep chatting so I can get to know you better.",
    premiumOnly: "Premium Feature",
    premiumMemories: "Shared memories are reserved for Premium users.",
    error: "Error",
    tryAgain: "Try again",
    sessionExpired: "Session expired",
    pleaseLogin: "Please log in again.",
    loading: "Loading...",
    send: "Send",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    delete: "Delete",
  },
  es: {
    messagePlaceholder: "Escribe un mensaje...",
    callButton: "Llamar",
    endCallButton: "Terminar llamada",
    videoButton: "Video",
    listening: "Escuchando...",
    callEnded: "Llamada terminada",
    callEndedDesc: "La sesión se ha cerrado correctamente.",
    connected: "¡Conectado!",
    connectedDesc: "Estás hablando con",
    connectionError: "Error de conexión",
    clearHistory: "Borrar historial",
    historyCleared: "Historial borrado",
    analyzing: "Analizando sesión...",
    sessionTooShort: "Sigue conversando para que pueda conocerte mejor.",
    premiumOnly: "Función Premium",
    premiumMemories: "Los recuerdos compartidos están reservados para usuarios Premium.",
    error: "Error",
    tryAgain: "Inténtalo de nuevo",
    sessionExpired: "Sesión expirada",
    pleaseLogin: "Por favor, inicia sesión de nuevo.",
    loading: "Cargando...",
    send: "Enviar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    save: "Guardar",
    delete: "Eliminar",
  },
  fr: {
    messagePlaceholder: "Écris un message...",
    callButton: "Appeler",
    endCallButton: "Terminer l'appel",
    videoButton: "Vidéo",
    listening: "À l'écoute...",
    callEnded: "Appel terminé",
    callEndedDesc: "La session a été fermée avec succès.",
    connected: "Connecté !",
    connectedDesc: "Tu parles avec",
    connectionError: "Erreur de connexion",
    clearHistory: "Effacer l'historique",
    historyCleared: "Historique effacé",
    analyzing: "Analyse de la session...",
    sessionTooShort: "Continue à discuter pour que je puisse mieux te connaître.",
    premiumOnly: "Fonction Premium",
    premiumMemories: "Les souvenirs partagés sont réservés aux utilisateurs Premium.",
    error: "Erreur",
    tryAgain: "Réessayer",
    sessionExpired: "Session expirée",
    pleaseLogin: "Veuillez vous reconnecter.",
    loading: "Chargement...",
    send: "Envoyer",
    cancel: "Annuler",
    confirm: "Confirmer",
    save: "Sauvegarder",
    delete: "Supprimer",
  },
  de: {
    messagePlaceholder: "Schreibe eine Nachricht...",
    callButton: "Anrufen",
    endCallButton: "Anruf beenden",
    videoButton: "Video",
    listening: "Höre zu...",
    callEnded: "Anruf beendet",
    callEndedDesc: "Die Sitzung wurde erfolgreich beendet.",
    connected: "Verbunden!",
    connectedDesc: "Du sprichst mit",
    connectionError: "Verbindungsfehler",
    clearHistory: "Verlauf löschen",
    historyCleared: "Verlauf gelöscht",
    analyzing: "Sitzung wird analysiert...",
    sessionTooShort: "Chatte weiter, damit ich dich besser kennenlernen kann.",
    premiumOnly: "Premium-Funktion",
    premiumMemories: "Geteilte Erinnerungen sind Premium-Nutzern vorbehalten.",
    error: "Fehler",
    tryAgain: "Erneut versuchen",
    sessionExpired: "Sitzung abgelaufen",
    pleaseLogin: "Bitte melde dich erneut an.",
    loading: "Laden...",
    send: "Senden",
    cancel: "Abbrechen",
    confirm: "Bestätigen",
    save: "Speichern",
    delete: "Löschen",
  },
  pt: {
    messagePlaceholder: "Escreve uma mensagem...",
    callButton: "Ligar",
    endCallButton: "Terminar chamada",
    videoButton: "Vídeo",
    listening: "Ouvindo...",
    callEnded: "Chamada terminada",
    callEndedDesc: "A sessão foi encerrada com sucesso.",
    connected: "Conectado!",
    connectedDesc: "Estás a falar com",
    connectionError: "Erro de conexão",
    clearHistory: "Limpar histórico",
    historyCleared: "Histórico limpo",
    analyzing: "Analisando sessão...",
    sessionTooShort: "Continua a conversar para que eu possa conhecer-te melhor.",
    premiumOnly: "Função Premium",
    premiumMemories: "As memórias partilhadas são reservadas para utilizadores Premium.",
    error: "Erro",
    tryAgain: "Tentar novamente",
    sessionExpired: "Sessão expirada",
    pleaseLogin: "Por favor, inicia sessão novamente.",
    loading: "Carregando...",
    send: "Enviar",
    cancel: "Cancelar",
    confirm: "Confirmar",
    save: "Guardar",
    delete: "Eliminar",
  },
  auto: {
    // Default to English for auto-detect fallback
    messagePlaceholder: "Type a message...",
    callButton: "Call",
    endCallButton: "End Call",
    videoButton: "Video",
    listening: "Listening...",
    callEnded: "Call ended",
    callEndedDesc: "The session has been closed successfully.",
    connected: "Connected!",
    connectedDesc: "You're speaking with",
    connectionError: "Connection error",
    clearHistory: "Clear history",
    historyCleared: "History cleared",
    analyzing: "Analyzing session...",
    sessionTooShort: "Keep chatting so I can get to know you better.",
    premiumOnly: "Premium Feature",
    premiumMemories: "Shared memories are reserved for Premium users.",
    error: "Error",
    tryAgain: "Try again",
    sessionExpired: "Session expired",
    pleaseLogin: "Please log in again.",
    loading: "Loading...",
    send: "Send",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    delete: "Delete",
  },
};

// Language detection from text
export function detectLanguageFromText(text: string): SupportedLanguage {
  const langPatterns: Record<SupportedLanguage, RegExp[]> = {
    it: [/\b(ciao|come|stai|sono|vorrei|grazie|buongiorno|perché|cosa|quando|bene|oggi|anche|sempre|tutto|molto|lavoro|casa|famiglia)\b/i],
    en: [/\b(hello|how|are|you|want|thanks|good|morning|why|what|when|the|is|this|that|with|have|will|would|could|should)\b/i],
    es: [/\b(hola|como|estas|soy|quiero|gracias|buenos|días|porque|que|cuando|también|siempre|trabajo|casa|familia|muy|bien|ahora)\b/i],
    fr: [/\b(bonjour|comment|allez|suis|voudrais|merci|pourquoi|quoi|quand|aussi|toujours|travail|maison|famille|très|bien|maintenant|avec)\b/i],
    de: [/\b(hallo|wie|geht|bin|möchte|danke|guten|morgen|warum|was|wann|auch|immer|arbeit|haus|familie|sehr|gut|jetzt|mit|und)\b/i],
    pt: [/\b(olá|como|está|sou|quero|obrigado|bom|dia|porque|que|quando|também|sempre|trabalho|casa|família|muito|bem|agora|com)\b/i],
    auto: [],
  };

  for (const [lang, patterns] of Object.entries(langPatterns)) {
    if (lang === "auto") continue;
    if (patterns.some(p => p.test(text))) {
      return lang as SupportedLanguage;
    }
  }
  
  return "auto";
}

// Get browser language preference
export function getBrowserLanguage(): SupportedLanguage {
  const browserLang = navigator.language.split("-")[0].toLowerCase();
  if (browserLang in translations && browserLang !== "auto") {
    return browserLang as SupportedLanguage;
  }
  return "en";
}

// Get translations for a specific language
export function getTranslations(lang: SupportedLanguage): Translations {
  if (lang === "auto") {
    return translations[getBrowserLanguage()];
  }
  return translations[lang] || translations.en;
}

// Helper to get a specific translation key
export function t(key: keyof Translations, lang: SupportedLanguage = "auto"): string {
  const trans = getTranslations(lang);
  return trans[key] || translations.en[key] || key;
}

// Speech Recognition language codes
export const speechRecognitionLanguages: Record<SupportedLanguage, string> = {
  it: "it-IT",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  pt: "pt-PT",
  auto: "it-IT", // Default fallback
};

// VAPI transcription language code
export function getVapiTranscriptionLanguage(lang: SupportedLanguage): string {
  // For multi-language support in VAPI, we use "multi"
  if (lang === "auto") return "multi";
  
  const languageMap: Record<string, string> = {
    it: "it",
    en: "en",
    es: "es",
    fr: "fr",
    de: "de",
    pt: "pt",
  };
  
  return languageMap[lang] || "multi";
}
