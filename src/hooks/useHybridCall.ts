import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HybridMessage {
  id: string;
  type: "link" | "quote" | "exercise" | "book" | "note" | "summary";
  content: string;
  title?: string;
  url?: string;
  timestamp: Date;
}

interface CallTranscript {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface UseHybridCallProps {
  avatarId: string;
  avatarName: string;
  onChatMessage?: (message: { role: "assistant"; content: string }) => void;
}

// Patterns to detect when Marco mentions something shareable
const SHARE_PATTERNS = {
  book: [
    /(?:libro|book|lettura|leggi|leggere)\s+[""']?([^""']+)[""']?/i,
    /ti consiglio\s+[""']?([^""']+)[""']?/i,
    /(?:hai letto|conosci)\s+[""']?([^""']+)[""']?/i,
  ],
  quote: [
    /come diceva\s+(\w+)/i,
    /(?:citazione|quote|frase)\s*[:"]\s*([^"]+)/i,
    /[""]([^""]{20,})[""]/,
  ],
  exercise: [
    /esercizio\s+(?:di\s+)?(\w+)/i,
    /(?:prova a|facciamo)\s+(respirare|meditare|visualizzare)/i,
    /tecnica\s+(?:del|della|di)\s+(\w+)/i,
  ],
  link: [
    /(https?:\/\/[^\s]+)/i,
  ],
};

export function useHybridCall({
  avatarId,
  avatarName,
  onChatMessage,
}: UseHybridCallProps) {
  const { toast } = useToast();
  const [isCallActive, setIsCallActive] = useState(false);
  const [hybridMessages, setHybridMessages] = useState<HybridMessage[]>([]);
  const [transcripts, setTranscripts] = useState<CallTranscript[]>([]);
  const callStartTime = useRef<Date | null>(null);
  const processedTexts = useRef<Set<string>>(new Set());

  // Start tracking a call
  const startCallTracking = useCallback(() => {
    setIsCallActive(true);
    callStartTime.current = new Date();
    setTranscripts([]);
    setHybridMessages([]);
    processedTexts.current.clear();
    console.log("Hybrid call tracking started");
  }, []);

  // Add transcript from Vapi
  const addTranscript = useCallback((role: "user" | "assistant", text: string) => {
    if (!text.trim()) return;
    
    setTranscripts((prev) => [
      ...prev,
      { role, text, timestamp: new Date() },
    ]);

    // Only process assistant messages for shareable content
    if (role === "assistant" && !processedTexts.current.has(text)) {
      processedTexts.current.add(text);
      detectAndShareContent(text);
    }
  }, []);

  // Detect shareable content in assistant messages
  const detectAndShareContent = useCallback((text: string) => {
    const lowerText = text.toLowerCase();

    // Detect books
    for (const pattern of SHARE_PATTERNS.book) {
      const match = text.match(pattern);
      if (match) {
        const bookTitle = match[1]?.trim();
        if (bookTitle && bookTitle.length > 3) {
          addHybridMessage({
            type: "book",
            title: `📚 ${bookTitle}`,
            content: `${avatarName} ti ha consigliato: **"${bookTitle}"**\n\nSalvalo per dopo!`,
          });
          return;
        }
      }
    }

    // Detect quotes
    for (const pattern of SHARE_PATTERNS.quote) {
      const match = text.match(pattern);
      if (match) {
        const quote = match[1]?.trim();
        if (quote && quote.length > 15) {
          addHybridMessage({
            type: "quote",
            title: "💬 Citazione",
            content: `> "${quote}"\n\n— Condivisa da ${avatarName}`,
          });
          return;
        }
      }
    }

    // Detect breathing/meditation exercises
    if (
      lowerText.includes("respir") ||
      lowerText.includes("inspira") ||
      lowerText.includes("espira") ||
      lowerText.includes("medit")
    ) {
      if (lowerText.includes("prova") || lowerText.includes("facciamo")) {
        addHybridMessage({
          type: "exercise",
          title: "🧘 Esercizio di Respirazione",
          content: `**Tecnica condivisa da ${avatarName}:**\n\n1. Inspira lentamente per 4 secondi\n2. Trattieni per 4 secondi\n3. Espira per 6 secondi\n4. Ripeti 3-5 volte\n\n_Salvato per praticarlo dopo_`,
        });
        return;
      }
    }

    // Detect links
    for (const pattern of SHARE_PATTERNS.link) {
      const match = text.match(pattern);
      if (match) {
        const url = match[1];
        addHybridMessage({
          type: "link",
          title: "🔗 Link Condiviso",
          content: `${avatarName} ti ha inviato un link:\n\n${url}`,
          url,
        });
        return;
      }
    }

    // Detect user requests to share
    const userWantsShared = [
      /mandami/i,
      /scrivimi/i,
      /inviami/i,
      /salvami/i,
      /annotami/i,
    ];

    // Check last user transcript
    const lastUserTranscript = transcripts
      .filter((t) => t.role === "user")
      .slice(-1)[0];

    if (lastUserTranscript) {
      for (const pattern of userWantsShared) {
        if (pattern.test(lastUserTranscript.text)) {
          // User requested something to be sent - send a note
          addHybridMessage({
            type: "note",
            title: "📝 Nota da " + avatarName,
            content: text.substring(0, 500),
          });
          return;
        }
      }
    }
  }, [avatarName, transcripts]);

  // Add a hybrid message
  const addHybridMessage = useCallback((message: Omit<HybridMessage, "id" | "timestamp">) => {
    const newMessage: HybridMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };

    setHybridMessages((prev) => [...prev, newMessage]);

    // Also send to chat
    if (onChatMessage) {
      onChatMessage({
        role: "assistant",
        content: `${message.title ? `**${message.title}**\n\n` : ""}${message.content}`,
      });
    }

    // Show toast notification
    toast({
      title: message.title || "Messaggio salvato",
      description: "Contenuto aggiunto alla chat",
    });
  }, [onChatMessage, toast]);

  // End call and generate summary
  const endCallAndGenerateSummary = useCallback(async () => {
    if (!isCallActive || transcripts.length < 2) {
      setIsCallActive(false);
      return;
    }

    setIsCallActive(false);
    const endTime = new Date();
    const duration = callStartTime.current
      ? Math.round((endTime.getTime() - callStartTime.current.getTime()) / 1000)
      : 0;

    console.log(`Call ended. Duration: ${duration}s, Transcripts: ${transcripts.length}`);

    // Generate post-call summary
    try {
      const { data, error } = await supabase.functions.invoke("call-summary", {
        body: {
          avatarId,
          avatarName,
          transcripts: transcripts.map((t) => ({
            role: t.role,
            text: t.text,
          })),
          durationSeconds: duration,
          hybridMessages: hybridMessages.map((m) => ({
            type: m.type,
            content: m.content,
          })),
        },
      });

      if (error) throw error;

      if (data?.summary) {
        // Add summary to chat
        if (onChatMessage) {
          onChatMessage({
            role: "assistant",
            content: data.summary,
          });
        }

        toast({
          title: "Riepilogo della chiamata",
          description: `${avatarName} ha preparato un riepilogo per te`,
        });
      }
    } catch (error) {
      console.error("Failed to generate call summary:", error);
    }
  }, [isCallActive, transcripts, hybridMessages, avatarId, avatarName, onChatMessage, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isCallActive) {
        setIsCallActive(false);
      }
    };
  }, [isCallActive]);

  return {
    isCallActive,
    hybridMessages,
    transcripts,
    startCallTracking,
    addTranscript,
    endCallAndGenerateSummary,
    addHybridMessage,
  };
}
