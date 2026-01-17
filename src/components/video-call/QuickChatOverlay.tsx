import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface QuickChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  avatarName: string;
  avatarImage: string;
  avatarId: string;
  avatarPersonality?: string[];
  onSendMessage: (text: string) => void;
}

export function QuickChatOverlay({
  isOpen,
  onClose,
  avatarName,
  avatarImage,
  avatarId,
  avatarPersonality = [],
  onSendMessage,
}: QuickChatOverlayProps) {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ragContext, setRagContext] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      // Pre-fetch some RAG context on open
      fetchRagContext();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch RAG context for the current user
  const fetchRagContext = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch user context
      const { data: userContext } = await supabase
        .from("user_context")
        .select("key, value, context_type")
        .eq("user_id", session.user.id)
        .eq("avatar_id", avatarId)
        .limit(10);

      // Fetch social graph
      const { data: socialGraph } = await supabase
        .from("social_graph")
        .select("person_name, relationship, context")
        .eq("user_id", session.user.id)
        .eq("avatar_id", avatarId)
        .limit(5);

      // Fetch recent session insights
      const { data: insights } = await supabase
        .from("session_insights")
        .select("topic, summary, mood")
        .eq("user_id", session.user.id)
        .eq("avatar_id", avatarId)
        .order("created_at", { ascending: false })
        .limit(3);

      // Build context string
      let context = "";
      
      if (userContext && userContext.length > 0) {
        context += "Ricordi dell'utente:\n";
        userContext.forEach(c => {
          context += `- ${c.key}: ${c.value}\n`;
        });
      }

      if (socialGraph && socialGraph.length > 0) {
        context += "\nPersone importanti:\n";
        socialGraph.forEach(p => {
          context += `- ${p.person_name}${p.relationship ? ` (${p.relationship})` : ""}${p.context ? `: ${p.context}` : ""}\n`;
        });
      }

      if (insights && insights.length > 0) {
        context += "\nConversazioni recenti:\n";
        insights.forEach(i => {
          context += `- ${i.topic || "Chat"}${i.mood ? ` (mood: ${i.mood})` : ""}\n`;
        });
      }

      setRagContext(context);
    } catch (error) {
      console.error("Error fetching RAG context:", error);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Build message history for context
      const messageHistory = [...messages, { role: "user", content: userMessage }].map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Call chat API with RAG context for quick response
      const response = await supabase.functions.invoke("chat", {
        body: {
          messages: messageHistory,
          avatarName,
          avatarId,
          avatarPersonality,
          avatarRole: "friend",
          avatarTagline: "",
          avatarDescription: "",
          quickMode: true, // Shorter responses for video call
          ragContext: ragContext, // Include RAG context
          isVideoCall: true, // Flag for video call mode
        },
      });

      if (response.error) throw response.error;

      // Handle streaming or direct response
      let assistantContent = "";
      
      if (response.data?.content) {
        assistantContent = response.data.content;
      } else if (response.data?.choices?.[0]?.message?.content) {
        assistantContent = response.data.choices[0].message.content;
      } else if (typeof response.data === "string") {
        assistantContent = response.data;
      } else {
        assistantContent = "...";
      }
      
      // Add assistant message
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantContent,
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Send to HeyGen for lip-sync
      onSendMessage(assistantContent);
    } catch (error) {
      console.error("Quick chat error:", error);
      // Add error message
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Scusa, ho avuto un problema. Riprova!",
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute inset-0 z-50 flex flex-col"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Chat Panel */}
          <div className="relative flex-1 flex flex-col mt-auto max-h-[70vh]">
            <div className="bg-background/95 backdrop-blur-xl rounded-t-3xl flex-1 flex flex-col overflow-hidden border-t border-border/50">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <img
                    src={avatarImage}
                    alt={avatarName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-primary/30"
                  />
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      {avatarName}
                      {ragContext && (
                        <span className="flex items-center gap-1 text-xs text-primary font-normal">
                          <Brain className="w-3 h-3" />
                          RAG
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Chat sincronizzata con video
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    <Brain className="w-8 h-8 mx-auto mb-3 text-primary/50" />
                    <p>Scrivi un messaggio rapido a {avatarName}</p>
                    <p className="text-xs mt-1 opacity-60">
                      {ragContext 
                        ? "Contesto memoria attivo - può citare i tuoi ricordi" 
                        : "La risposta verrà sincronizzata con il video"}
                    </p>
                  </div>
                )}
                
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Pensando...</span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Scrivi un messaggio..."
                    className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
                    disabled={isLoading}
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className="rounded-full w-10 h-10 shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
