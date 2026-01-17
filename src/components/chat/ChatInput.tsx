import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, MicOff, Loader2, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SupportedLanguage, speechRecognitionLanguages, Translations } from "@/lib/i18n";

interface ChatInputProps {
  onSend: (message: string) => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  isVoiceCallActive?: boolean;
  placeholder?: string;
  avatarName?: string;
  language?: SupportedLanguage;
  translations?: Partial<Translations>;
}

export function ChatInput({
  onSend,
  onVoiceCall,
  onVideoCall,
  disabled = false,
  isLoading = false,
  isVoiceCallActive = false,
  placeholder,
  avatarName = "Marco",
  language = "auto",
  translations,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Get speech recognition language code
  const getSpeechLang = () => {
    return speechRecognitionLanguages[language] || "it-IT";
  };

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      // Use dynamic language based on detected/selected language
      recognitionRef.current.lang = getSpeechLang();

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setValue(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  // Update speech recognition language when language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = getSpeechLang();
    }
  }, [language]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSend = () => {
    if (!value.trim() || disabled || isLoading) return;
    onSend(value.trim());
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-chat-input border-t border-border/50 p-4"
    >
      <div className="container mx-auto max-w-2xl">
        {/* Quick action buttons */}
        <div className="flex gap-2 mb-3">
          {onVoiceCall && (
            <Button
              variant={isVoiceCallActive ? "destructive" : "outline"}
              size="sm"
              onClick={onVoiceCall}
              className={cn(
                "gap-2 text-xs",
                !isVoiceCallActive && "hover:bg-primary/10 hover:text-primary hover:border-primary/50"
              )}
            >
              <Phone className="w-3.5 h-3.5" />
              {isVoiceCallActive 
                ? (translations?.endCallButton || "End Call") 
                : `${translations?.callButton || "Call"} ${avatarName}`}
            </Button>
          )}
          {onVideoCall && (
            <Button
              variant="outline"
              size="sm"
              onClick={onVideoCall}
              className="gap-2 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/50"
            >
              <Video className="w-3.5 h-3.5" />
              {translations?.videoButton || "Video"}
              Video
            </Button>
          )}
        </div>

        {/* Input Area */}
        <div className="relative flex items-end gap-2">
          {/* Textarea Container */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              lang={getSpeechLang().split("-")[0]}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || translations?.messagePlaceholder || `Message ${avatarName}...`}
              disabled={disabled || isLoading}
              rows={1}
              className={cn(
                "w-full resize-none rounded-2xl px-4 py-3 pr-12",
                "bg-background/80 backdrop-blur-sm border border-border/50",
                "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                "placeholder:text-muted-foreground/60",
                "text-sm leading-relaxed",
                "transition-all duration-200",
                "min-h-[48px] max-h-[120px]",
                isListening && "ring-2 ring-destructive/50 border-destructive/50"
              )}
            />

            {/* Speech-to-Text Button */}
            {speechSupported && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleListening}
                disabled={disabled || isLoading}
                className={cn(
                  "absolute right-2 bottom-1.5 h-8 w-8",
                  "hover:bg-transparent",
                  isListening 
                    ? "text-destructive animate-pulse" 
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <AnimatePresence mode="wait">
                  {isListening ? (
                    <motion.div
                      key="listening"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <MicOff className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="not-listening"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Mic className="w-4 h-4" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            )}

            {/* Listening indicator */}
            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute -top-8 left-4 text-xs text-destructive flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  {translations?.listening || "Listening..."}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!value.trim() || disabled || isLoading}
            size="icon"
            className={cn(
              "h-12 w-12 rounded-xl gradient-primary",
              "shadow-lg hover:shadow-xl transition-all duration-300",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                </motion.div>
              ) : (
                <motion.div
                  key="send"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Send className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
