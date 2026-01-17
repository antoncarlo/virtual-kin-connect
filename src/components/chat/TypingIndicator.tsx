import { motion } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TypingIndicatorProps {
  avatarImage?: string;
  avatarName?: string;
  variant?: "reflecting" | "typing";
}

export function TypingIndicator({
  avatarImage,
  avatarName,
  variant = "reflecting",
}: TypingIndicatorProps) {
  const messages = {
    reflecting: `${avatarName || "Marco"} is reflecting...`,
    typing: `${avatarName || "Marco"} is typing...`,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="flex gap-3 mr-auto max-w-[85%]"
    >
      {/* Avatar */}
      {avatarImage && (
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
        >
          <Avatar className="w-9 h-9 border-2 border-primary/30 shadow-lg">
            <AvatarImage src={avatarImage} alt={avatarName || "Assistant"} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {avatarName?.[0] || "A"}
            </AvatarFallback>
          </Avatar>
        </motion.div>
      )}

      {/* Typing Bubble */}
      <div className="relative">
        <div className="glass-chat rounded-2xl rounded-bl-md px-4 py-3 shadow-lg">
          {/* Animated Background Pulse */}
          <motion.div
            className="absolute inset-0 rounded-2xl rounded-bl-md bg-gradient-to-r from-primary/5 to-accent/5"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="relative z-10 flex items-center gap-3">
            {/* Animated Dots */}
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent"
                  animate={{
                    y: [0, -6, 0],
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            {/* Status Text */}
            <motion.span
              className="text-xs text-muted-foreground italic"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {messages[variant]}
            </motion.span>
          </div>
        </div>

        {/* Subtle glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl rounded-bl-md bg-primary/10 blur-xl -z-10"
          animate={{ opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
}
