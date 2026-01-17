import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  avatarImage?: string;
  avatarName?: string;
  isLatest?: boolean;
}

export function ChatBubble({
  content,
  role,
  timestamp,
  avatarImage,
  avatarName,
  isLatest = false,
}: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        mass: 0.8
      }}
      className={cn(
        "flex gap-3 max-w-[85%]",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar for assistant */}
      {!isUser && avatarImage && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
        >
          <Avatar className="w-9 h-9 border-2 border-primary/20 shadow-lg">
            <AvatarImage src={avatarImage} alt={avatarName || "Assistant"} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {avatarName?.[0] || "A"}
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}

      {/* Message Bubble */}
      <div
        className={cn(
          "relative px-4 py-3 rounded-2xl shadow-lg transition-all duration-300",
          isUser 
            ? "gradient-primary text-primary-foreground rounded-br-md" 
            : "glass-chat rounded-bl-md hover:shadow-xl",
          isLatest && !isUser && "ring-1 ring-primary/20"
        )}
      >
        {/* Glassmorphism overlay for assistant */}
        {!isUser && (
          <div className="absolute inset-0 rounded-2xl rounded-bl-md bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 pointer-events-none" />
        )}

        {/* Message Content with Markdown */}
        <div className={cn(
          "relative z-10 text-sm leading-relaxed",
          isUser ? "text-primary-foreground" : "text-foreground"
        )}>
          <ReactMarkdown
            components={{
              // Strong/Bold
              strong: ({ children }) => (
                <strong className="font-semibold">{children}</strong>
              ),
              // Emphasis/Italic
              em: ({ children }) => (
                <em className="italic">{children}</em>
              ),
              // Lists
              ul: ({ children }) => (
                <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
              // Blockquote for wisdom/quotes
              blockquote: ({ children }) => (
                <blockquote className={cn(
                  "border-l-3 border-l-4 pl-3 my-2 italic",
                  isUser 
                    ? "border-primary-foreground/30 text-primary-foreground/90" 
                    : "border-primary/40 text-muted-foreground"
                )}>
                  {children}
                </blockquote>
              ),
              // Paragraphs
              p: ({ children }) => (
                <p className="mb-2 last:mb-0">{children}</p>
              ),
              // Links
              a: ({ href, children }) => (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={cn(
                    "underline underline-offset-2 hover:opacity-80 transition-opacity",
                    isUser ? "text-primary-foreground" : "text-primary"
                  )}
                >
                  {children}
                </a>
              ),
              // Code inline
              code: ({ children }) => (
                <code className={cn(
                  "px-1.5 py-0.5 rounded text-xs font-mono",
                  isUser 
                    ? "bg-primary-foreground/20" 
                    : "bg-muted text-foreground"
                )}>
                  {children}
                </code>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {/* Timestamp */}
        <p className={cn(
          "text-[10px] mt-2 relative z-10",
          isUser ? "text-primary-foreground/60" : "text-muted-foreground/70"
        )}>
          {timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        {/* Subtle glow effect for user messages */}
        {isUser && (
          <div className="absolute inset-0 rounded-2xl rounded-br-md opacity-50 blur-xl bg-gradient-to-r from-primary/30 to-accent/30 -z-10" />
        )}
      </div>
    </motion.div>
  );
}
