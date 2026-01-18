import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MoreVertical,
  Loader2,
  PhoneOff,
  Trash2,
  Brain,
  Sparkles,
  Image,
  User,
  Lock,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { avatars } from "@/data/avatars";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useVapiCall } from "@/hooks/useVapiCall";
import { useSessionInsights } from "@/hooks/useSessionInsights";
import { useHybridCall } from "@/hooks/useHybridCall";
import { useLanguage } from "@/hooks/useLanguage";
import { useMem0 } from "@/hooks/useMem0";
import { useConvEmotion } from "@/hooks/useConvEmotion";
import { IncomingCallModal } from "@/components/IncomingCallModal";
import { VideoCallModal } from "@/components/VideoCallModal";
import { ImmersiveVideoCall } from "@/components/video-call";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ChatInput } from "@/components/chat/ChatInput";
import { WelcomeBackMessage } from "@/components/chat/WelcomeBackMessage";
import { HybridCallBanner } from "@/components/chat/HybridCallBanner";
import { SharedMemoriesGallery } from "@/components/gallery/SharedMemoriesGallery";
import { AboutAvatarPanel } from "@/components/avatar/AboutAvatarPanel";
import { useAvatarIdentity } from "@/hooks/useAvatarIdentity";
import { useProfile } from "@/hooks/useProfile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export default function Chat() {
  const { avatarId } = useParams<{ avatarId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showAboutPanel, setShowAboutPanel] = useState(false);
  const [hoursSinceLastChat, setHoursSinceLastChat] = useState<number | undefined>();
  const [lastTopic, setLastTopic] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastActivityTime = useRef<Date>(new Date());
  const sessionAnalysisTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Avatar identity and affinity hook
  const {
    identity: avatarIdentity,
    affinity: userAffinity,
    unlockedSecrets,
    incrementMessages,
  } = useAvatarIdentity(avatarId || "");

  // Profile for premium check
  const { profile } = useProfile();
  const isPremium = profile?.subscription_tier === "Premium" || profile?.subscription_tier === "Pro";

  // Session insights hook for post-session analysis
  const {
    isAnalyzing,
    startSession,
    endSession,
  } = useSessionInsights(avatarId);

  // Multilingual support hook
  const { language, translations, detectFromMessage } = useLanguage();

  // Mem0 memory system - intelligent memory layer
  const {
    memoryContext,
    addMemories,
    getRelevantContext,
    isInitialized: isMem0Ready,
  } = useMem0({ avatarId: avatarId || "" });

  // Conv-emotion for contextual emotion recognition
  const {
    currentMood,
    moodEmoji,
    moodIntensity,
    trajectory: emotionalTrajectory,
    suggestedTone,
    analyzeMessages: analyzeEmotions,
    addMessageAndAnalyze,
  } = useConvEmotion();

  // Hybrid call hook for in-call chat messages
  const {
    isCallActive,
    startCallTracking,
    addTranscript,
    endCallAndGenerateSummary,
  } = useHybridCall({
    avatarId: avatarId || "",
    avatarName: avatar?.name || "Marco",
    onChatMessage: async (message) => {
      await addMessage(message.role, message.content);
    },
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
        // Also track for hybrid mode
        addTranscript("user", text);
      }
    },
    onCallStart: () => {
      startCallTracking();
    },
    onCallEnd: async () => {
      toast({
        title: "Chiamata terminata",
        description: `Generando riepilogo...`,
      });
      // Generate post-call summary
      await endCallAndGenerateSummary();
    },
  });

  // Fetch last chat info for welcome back message
  useEffect(() => {
    const fetchLastChatInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !avatarId) return;

      try {
        const { data } = await supabase
          .from("user_context")
          .select("value, updated_at")
          .eq("user_id", session.user.id)
          .eq("avatar_id", avatarId)
          .eq("context_type", "session_tracking")
          .eq("key", "last_interaction")
          .single();

        if (data) {
          const lastInteraction = new Date(data.updated_at);
          const now = new Date();
          const hours = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60);
          setHoursSinceLastChat(hours);
        }

        // Get last topic from session insights
        const { data: insights } = await supabase
          .from("session_insights")
          .select("topic")
          .eq("user_id", session.user.id)
          .eq("avatar_id", avatarId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (insights?.topic) {
          setLastTopic(insights.topic);
        }
      } catch (error) {
        // Ignore errors, this is optional
      }
    };

    fetchLastChatInfo();
  }, [avatarId]);

  // Start session tracking on mount
  useEffect(() => {
    startSession();
    
    // Cleanup: trigger analysis when leaving the page
    return () => {
      if (sessionAnalysisTimeout.current) {
        clearTimeout(sessionAnalysisTimeout.current);
      }
    };
  }, [startSession]);

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

  // Auto-trigger session analysis after 2 minutes of inactivity
  useEffect(() => {
    const checkInactivity = () => {
      const now = new Date();
      const inactiveTime = now.getTime() - lastActivityTime.current.getTime();
      
      // If inactive for 2 minutes and has enough messages, trigger analysis
      if (inactiveTime >= 120000 && messages.length >= 6) {
        triggerSessionAnalysis();
      }
    };

    const interval = setInterval(checkInactivity, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [messages.length]);

  // Trigger session analysis with Mem0 and conv-emotion
  const triggerSessionAnalysis = useCallback(async () => {
    if (!avatar || messages.length < 4) return;

    const chatMessages = messages
      .filter(m => m.role === "user" || m.role === "assistant")
      .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

    // Analyze emotions across the conversation
    analyzeEmotions(chatMessages);

    // Store memories using Mem0
    if (isMem0Ready) {
      try {
        await addMemories(chatMessages, {
          avatar_id: avatar.id,
          mood: currentMood,
          mood_intensity: moodIntensity,
          emotional_trajectory: emotionalTrajectory,
        });
      } catch (err) {
        console.error("Failed to store memories in Mem0:", err);
      }
    }

    // Original session analysis
    await endSession(chatMessages, avatar.id);
  }, [avatar, messages, endSession, analyzeEmotions, isMem0Ready, addMemories, currentMood, moodIntensity, emotionalTrajectory]);

  const streamChat = useCallback(async (
    chatMessages: { role: "user" | "assistant"; content: string }[],
    onDelta: (delta: string) => void,
    onDone: (fullContent: string) => void
  ) => {
    if (!avatar) return;

    // Get the user's session token for authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast({
        title: "Sessione scaduta",
        description: "Per favore effettua nuovamente il login.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        messages: chatMessages,
        avatarName: avatar.name,
        avatarPersonality: avatar.personality,
        avatarRole: avatar.role,
        avatarTagline: avatar.tagline,
        avatarDescription: avatar.description,
        avatarId: avatar.id,
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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

  const handleSend = async (userContent: string) => {
    if (!userContent.trim() || isLoading || !avatar) return;

    // Update activity time for inactivity tracking
    lastActivityTime.current = new Date();

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
          // Increment affinity message count
          await incrementMessages();
          await initiateCallIfRequested(userContent);
          
          // Detect language from assistant response for UI adaptation
          if (finalContent) {
            detectFromMessage(finalContent);
          }
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

  const handleClearHistory = async () => {
    // Trigger analysis before clearing
    await triggerSessionAnalysis();
    await clearHistory();
    toast({
      title: translations.historyCleared,
      description: `${translations.clearHistory} ${avatar?.name}.`,
    });
  };

  // Manual analysis trigger
  const handleManualAnalysis = async () => {
    if (messages.length < 4) {
      toast({
        title: translations.sessionTooShort.split(".")[0],
        description: translations.sessionTooShort,
      });
      return;
    }
    await triggerSessionAnalysis();
  };

  const handleVoiceCall = async () => {
    if (!avatar?.vapiAssistantId) {
      toast({
        title: translations.connectionError,
        description: `${avatar?.name} - ${translations.tryAgain}`,
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
      
      {/* Video Call Modal - Use Immersive HeyGen if available, otherwise fallback */}
      {avatar.heygenAvatarId ? (
        <ImmersiveVideoCall
          isOpen={showVideoCall}
          onClose={() => setShowVideoCall(false)}
          avatarName={avatar.name}
          avatarImage={avatar.imageUrl}
          avatarId={avatar.id}
          avatarPersonality={avatar.personality}
          heygenAvatarId={avatar.heygenAvatarId}
          heygenVoiceId={avatar.defaultVoiceId}
          heygenGender={avatar.heygenGender}
          vapiAssistantId={avatar.vapiAssistantId}
        />
      ) : (
        <VideoCallModal
          isOpen={showVideoCall}
          onClose={() => setShowVideoCall(false)}
          avatarName={avatar.name}
          avatarImage={avatar.imageUrl}
          avatarModelUrl={avatar.rpmAvatarUrl}
          vapiAssistantId={avatar.vapiAssistantId}
        />
      )}

      {/* Shared Memories Gallery */}
      <AnimatePresence>
        {showGallery && (
          <SharedMemoriesGallery
            avatarId={avatar.id}
            avatarName={avatar.name}
            avatarPersonality={avatar.personality.join(", ")}
            avatarImage={avatar.imageUrl}
            isOpen={showGallery}
            onClose={() => setShowGallery(false)}
          />
        )}
      </AnimatePresence>

      {/* About Avatar Panel */}
      <AboutAvatarPanel
        identity={avatarIdentity}
        affinity={userAffinity}
        unlockedSecrets={unlockedSecrets}
        isOpen={showAboutPanel}
        onClose={() => setShowAboutPanel(false)}
        avatarImage={avatar.imageUrl}
      />
      
      <div className="min-h-screen bg-gradient-subtle flex flex-col">
        {/* Header */}
        <header className="glass-chat-input border-b border-border/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Avatar className="w-11 h-11 border-2 border-primary/30 shadow-lg ring-2 ring-primary/10 ring-offset-2 ring-offset-background">
                  <AvatarImage src={avatar.imageUrl} alt={avatar.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {avatar.name[0]}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              
              <div>
                <h1 className="font-semibold text-foreground flex items-center gap-2">
                  {avatar.name}
                  {isVapiConnected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 text-xs font-normal text-primary"
                    >
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      On call
                    </motion.span>
                  )}
                </h1>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  {isVapiSpeaking ? "Speaking..." : avatar.tagline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* End Call Button (only when connected) */}
              {isVapiConnected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={endVapiCall}
                    className="gap-2"
                  >
                    <PhoneOff className="w-4 h-4" />
                    {translations.endCallButton}
                  </Button>
                </motion.div>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem 
                    onClick={() => setShowAboutPanel(true)}
                    className="gap-2"
                  >
                    <User className="w-4 h-4" />
                    Chi è {avatar.name}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      if (isPremium) {
                        setShowGallery(true);
                      } else {
                        toast({
                          title: translations.premiumOnly,
                          description: translations.premiumMemories,
                          variant: "default",
                        });
                      }
                    }}
                    className="gap-2"
                  >
                    {isPremium ? (
                      <Image className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                    Ricordi condivisi
                    {!isPremium && (
                      <span className="ml-auto text-xs text-gold">Premium</span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleManualAnalysis}
                    disabled={isAnalyzing || messages.length < 4}
                    className="gap-2"
                  >
                    <Brain className="w-4 h-4" />
                    {isAnalyzing ? translations.analyzing : translations.analyzing?.replace("...", "")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleClearHistory}
                    className="text-destructive focus:text-destructive gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {translations.clearHistory}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Hybrid Call Banner */}
        <HybridCallBanner
          isActive={isVapiConnected || isCallActive}
          avatarName={avatar.name}
          isSpeaking={isVapiSpeaking}
        />

        {/* Messages */}
        <main className="flex-1 overflow-y-auto px-4 py-6">
          <div className="container mx-auto max-w-2xl space-y-4">
            {/* Welcome back message */}
            {hoursSinceLastChat && hoursSinceLastChat > 5 && messages.length <= 1 && (
              <WelcomeBackMessage
                avatarName={avatar.name}
                lastTopic={lastTopic}
                hoursSinceLastChat={hoursSinceLastChat}
              />
            )}

            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <ChatBubble
                  key={message.id}
                  content={message.content}
                  role={message.role}
                  timestamp={message.timestamp}
                  avatarImage={message.role === "assistant" ? avatar.imageUrl : undefined}
                  avatarName={avatar.name}
                  isLatest={index === messages.length - 1}
                />
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            <AnimatePresence>
              {isTyping && (
                <TypingIndicator
                  avatarImage={avatar.imageUrl}
                  avatarName={avatar.name}
                  variant="reflecting"
                />
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          onVoiceCall={handleVoiceCall}
          onVideoCall={() => setShowVideoCall(true)}
          disabled={isVapiConnecting}
          isLoading={isLoading}
          isVoiceCallActive={isVapiConnected}
          avatarName={avatar.name}
          language={language}
          translations={translations}
        />
      </div>
    </>
  );
}
