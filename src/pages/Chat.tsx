import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Send, 
  MoreVertical, 
  Loader2,
  Phone,
  PhoneOff,
  Video,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { avatars } from "@/data/avatars";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useVapiCall } from "@/hooks/useVapiCall";
import { IncomingCallModal } from "@/components/IncomingCallModal";
import { VideoCallModal } from "@/components/VideoCallModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export default function Chat() {
  const { avatarId } = useParams<{ avatarId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const avatar = avatars.find((a) => a.id === avatarId);
  
  const welcomeMessage = avatar 
    ? `Ciao! Sono ${avatar.name}, ${avatar.tagline.toLowerCase()}. Come stai oggi? 💜`
    : "";

  const {
    messages,
    isLoading: isHistoryLoading,
    addMessage,
    updateLastAssistantMessage,
    clearHistory,
    getMessagesForAPI,
  } = useChatHistory({ 
    avatarId: avatarId || "", 
    welcomeMessage 
  });

  // Vapi voice call hook
  const {
    isConnecting: isVapiConnecting,
    isConnected: isVapiConnected,
    isSpeaking: isVapiSpeaking,
    startCall: startVapiCall,
    endCall: endVapiCall,
  } = useVapiCall({
    assistantId: avatar?.vapiAssistantId,
    onTranscript: async (text, isFinal) => {
      if (isFinal && text) {
        await addMessage("user", text);
      }
    },
    onCallEnd: () => {
      toast({
        title: "Chiamata terminata",
        description: `La chiamata con ${avatar?.name} è terminata.`,
      });
    },
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      }
    });
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const streamChat = useCallback(async (
    chatMessages: { role: "user" | "assistant"; content: string }[],
    onDelta: (delta: string) => void,
    onDone: (fullContent: string) => void
  ) => {
    if (!avatar) return;

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: chatMessages,
        avatarName: avatar.name,
        avatarPersonality: avatar.personality,
        avatarRole: avatar.role,
        avatarTagline: avatar.tagline,
        avatarDescription: avatar.description,
      }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      if (resp.status === 429) {
        toast({
          title: "Troppo veloce!",
          description: "Aspetta un momento prima di inviare un altro messaggio.",
          variant: "destructive",
        });
      } else if (resp.status === 402) {
        toast({
          title: "Servizio non disponibile",
          description: "Riprova più tardi.",
          variant: "destructive",
        });
      }
      throw new Error(errorData.error || "Failed to get response");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;
    let fullContent = "";

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullContent += content;
            onDelta(fullContent);
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            fullContent += content;
            onDelta(fullContent);
          }
        } catch { /* ignore */ }
      }
    }

    onDone(fullContent);
  }, [avatar, toast]);

  // Detect call request patterns in text
  const detectCallRequest = (text: string): boolean => {
    const callPatterns = [
      /chiamami/i,
      /puoi chiamarmi/i,
      /fammi una chiamata/i,
      /voglio parlarti/i,
      /parlami a voce/i,
      /usa la voce/i,
      /chiamata vocale/i,
      /sentiamoci/i,
      /mi chiami/i,
      /call me/i,
    ];
    return callPatterns.some(pattern => pattern.test(text));
  };

  // Handle initiating a call when requested - show incoming call modal
  const initiateCallIfRequested = async (userMessage: string) => {
    if (detectCallRequest(userMessage)) {
      if (!avatar?.vapiAssistantId) {
        toast({
          title: "Chiamata non disponibile",
          description: `${avatar?.name} non supporta ancora le chiamate vocali. Configura l'assistente Vapi.`,
          variant: "destructive",
        });
        return;
      }
      
      if (isVapiConnected) return;
      
      setTimeout(() => {
        setShowIncomingCall(true);
      }, 1500);
    }
  };

  // Handle accepting the incoming call
  const handleAcceptCall = async () => {
    setShowIncomingCall(false);
    try {
      await startVapiCall();
    } catch (error) {
      console.error("Failed to start call:", error);
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile avviare la chiamata. Riprova.",
      });
    }
  };

  // Handle rejecting the incoming call
  const handleRejectCall = () => {
    setShowIncomingCall(false);
    toast({
      title: "Chiamata rifiutata",
      description: `Hai rifiutato la chiamata di ${avatar?.name}.`,
    });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !avatar) return;

    const userContent = inputValue.trim();
    setInputValue("");
    setIsLoading(true);
    setIsTyping(true);

    await addMessage("user", userContent);

    const chatHistory = getMessagesForAPI();

    try {
      let isFirstChunk = true;
      
      await streamChat(
        [...chatHistory, { role: "user", content: userContent }],
        (fullContent) => {
          if (isFirstChunk) {
            addMessage("assistant", fullContent);
            isFirstChunk = false;
          } else {
            updateLastAssistantMessage(fullContent);
          }
          setIsTyping(false);
        },
        async (finalContent) => {
          setIsLoading(false);
          if (finalContent && isFirstChunk) {
            await addMessage("assistant", finalContent);
          }
          await initiateCallIfRequested(userContent);
        }
      );
    } catch (error) {
      console.error("Chat error:", error);
      setIsLoading(false);
      setIsTyping(false);
      toast({
        title: "Errore",
        description: "Non riesco a rispondere in questo momento. Riprova!",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = async () => {
    await clearHistory();
    toast({
      title: "Cronologia cancellata",
      description: `La chat con ${avatar?.name} è stata cancellata.`,
    });
  };

  const handleVoiceCall = async () => {
    if (!avatar?.vapiAssistantId) {
      toast({
        title: "Chiamata non disponibile",
        description: `Configura un assistente Vapi per ${avatar?.name}.`,
        variant: "destructive",
      });
      return;
    }

    if (isVapiConnected) {
      endVapiCall();
    } else {
      await startVapiCall();
    }
  };

  if (!avatar) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Avatar not found</p>
      </div>
    );
  }

  if (isHistoryLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Incoming Call Modal */}
      <IncomingCallModal
        isOpen={showIncomingCall}
        avatarName={avatar.name}
        avatarImage={avatar.imageUrl}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
      
      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={showVideoCall}
        onClose={() => setShowVideoCall(false)}
        avatarName={avatar.name}
        avatarImage={avatar.imageUrl}
        avatarModelUrl={avatar.rpmAvatarUrl}
        vapiAssistantId={avatar.vapiAssistantId}
      />
      
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="glass border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <Avatar className="w-10 h-10 border-2 border-primary/30">
                <AvatarImage src={avatar.imageUrl} alt={avatar.name} />
                <AvatarFallback>{avatar.name[0]}</AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="font-semibold text-foreground">{avatar.name}</h1>
                <p className="text-xs text-primary">
                  {isVapiConnected ? "In chiamata..." : isVapiSpeaking ? "Sta parlando..." : "Online"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Video Call Button */}
              <Button
                variant="ghost"
                size="icon"
                className="text-primary hover:bg-primary/10"
                onClick={() => setShowVideoCall(true)}
                title={`Videochiamata con ${avatar.name}`}
              >
                <Video className="w-5 h-5" />
              </Button>
              
              {/* Vapi Voice Call Button */}
              <Button
                variant={isVapiConnected ? "destructive" : "ghost"}
                size="icon"
                className={`relative ${!isVapiConnected && "text-primary hover:bg-primary/10"} ${isVapiSpeaking && "ring-2 ring-primary ring-offset-2"}`}
                onClick={handleVoiceCall}
                disabled={isVapiConnecting}
                title={isVapiConnected ? "Termina chiamata" : `Chiama ${avatar.name}`}
              >
                {isVapiConnecting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isVapiConnected ? (
                  <PhoneOff className="w-5 h-5" />
                ) : (
                  <Phone className="w-5 h-5" />
                )}
                {isVapiSpeaking && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                  </span>
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem 
                    onClick={handleClearHistory}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Cancella cronologia
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="container mx-auto max-w-2xl space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "gradient-primary text-primary-foreground rounded-br-md"
                        : "glass border border-border rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="glass border border-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input */}
        <footer className="glass border-t border-border p-4">
          <div className="container mx-auto max-w-2xl">
            <div className="flex gap-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Scrivi a ${avatar.name}...`}
                className="flex-1 bg-background/50"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="gradient-primary"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
