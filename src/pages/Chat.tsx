import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Send, 
  MoreVertical, 
  Loader2,
  Volume2,
  VolumeX,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { avatars } from "@/data/avatars";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useVoiceCall } from "@/hooks/useVoiceCall";
import { useChatHistory } from "@/hooks/useChatHistory";
import { VoiceCallButton, VoiceCallButtonRef } from "@/components/VoiceCallButton";
import { IncomingCallModal } from "@/components/IncomingCallModal";
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
  const [pendingCallRequest, setPendingCallRequest] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceCallRef = useRef<VoiceCallButtonRef>(null);

  const avatar = avatars.find((a) => a.id === avatarId);
  
  const welcomeMessage = avatar 
    ? `Ciao! Sono ${avatar.name}, ${avatar.tagline.toLowerCase()}. Come stai oggi? 💜`
    : "";

  const {
    messages,
    isLoading: isHistoryLoading,
    addMessage,
    updateLastAssistantMessage,
    saveAssistantMessage,
    clearHistory,
    getMessagesForAPI,
  } = useChatHistory({ 
    avatarId: avatarId || "", 
    welcomeMessage 
  });

  const { isPlaying, isLoading: isVoiceLoading, playMessage, stopPlayback } = useVoiceCall({ 
    voiceId: avatar?.voiceId || "" 
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
  const initiateCallIfRequested = async (userMessage: string, agentResponse: string) => {
    if (!voiceCallRef.current || voiceCallRef.current.isConnected) return;
    
    // Check if user asked to be called
    if (detectCallRequest(userMessage)) {
      // Small delay to let the chat response appear first, then show incoming call modal
      setTimeout(() => {
        setShowIncomingCall(true);
        setPendingCallRequest(true);
      }, 1500);
    }
  };

  // Handle accepting the incoming call
  const handleAcceptCall = async () => {
    setShowIncomingCall(false);
    setPendingCallRequest(false);
    try {
      await voiceCallRef.current?.startCall();
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
    setPendingCallRequest(false);
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

    // Add user message
    await addMessage("user", userContent);

    // Create placeholder for assistant response
    const assistantPlaceholder = {
      id: (Date.now() + 1).toString(),
      role: "assistant" as const,
      content: "",
      timestamp: new Date(),
    };

    // We need to manually add the placeholder since we're streaming
    const chatHistory = getMessagesForAPI();

    try {
      let isFirstChunk = true;
      
      await streamChat(
        [...chatHistory, { role: "user", content: userContent }],
        (fullContent) => {
          if (isFirstChunk) {
            // Add placeholder message on first chunk
            addMessage("assistant", fullContent);
            isFirstChunk = false;
          } else {
            updateLastAssistantMessage(fullContent);
          }
          setIsTyping(false);
        },
        async (finalContent) => {
          setIsLoading(false);
          // Save the final assistant message to database
          if (finalContent && !isFirstChunk) {
            // The message was already added via addMessage, we need to save it properly
            // Since addMessage already saves, we just need to make sure it's saved
          } else if (finalContent && isFirstChunk) {
            // Edge case: if streaming was so fast we never got a chunk update
            await addMessage("assistant", finalContent);
          }
          
          // Check if user requested a call and initiate it
          await initiateCallIfRequested(userContent, finalContent);
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
              <p className="text-xs text-primary">Online</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Voice Call Button */}
            <VoiceCallButton 
              ref={voiceCallRef}
              agentId={avatar.agentId} 
              avatarName={avatar.name}
              onUserTranscript={async (transcript) => {
                await addMessage("user", transcript);
              }}
              onAgentResponse={async (response) => {
                await addMessage("assistant", response);
              }}
            />
            
            {/* TTS Playback Button */}
            {isPlaying ? (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10"
                onClick={stopPlayback}
              >
                <VolumeX className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="text-primary hover:bg-primary/10"
                disabled={isVoiceLoading || messages.length === 0}
                onClick={() => {
                  const lastAssistantMessage = [...messages].reverse().find(m => m.role === "assistant");
                  if (lastAssistantMessage) {
                    playMessage(lastAssistantMessage.content);
                  }
                }}
              >
                {isVoiceLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
            )}
            
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
      <footer className="glass border-t border-border sticky bottom-0">
        <div className="container mx-auto max-w-2xl px-4 py-4">
          <div className="flex items-center gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Scrivi a ${avatar.name}...`}
              className="flex-1 bg-input border-border py-6"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="gradient-primary glow-primary h-12 w-12 p-0"
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
