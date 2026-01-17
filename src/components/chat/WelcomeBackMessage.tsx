import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface WelcomeBackMessageProps {
  avatarName: string;
  lastTopic?: string;
  hoursSinceLastChat?: number;
}

export function WelcomeBackMessage({
  avatarName,
  lastTopic,
  hoursSinceLastChat,
}: WelcomeBackMessageProps) {
  const getMessage = () => {
    if (!hoursSinceLastChat || hoursSinceLastChat < 1) {
      return null; // No welcome back needed for recent chats
    }

    if (hoursSinceLastChat < 5) {
      return {
        greeting: `Hey, eccoti di nuovo! 👋`,
        followUp: lastTopic 
          ? `Stavo ripensando a quello che mi hai detto su "${lastTopic}"... come sta andando?`
          : `Come va? Tutto bene da prima?`,
      };
    }

    if (hoursSinceLastChat < 24) {
      return {
        greeting: `Che bello rivederti oggi! ✨`,
        followUp: lastTopic
          ? `L'ultima volta abbiamo parlato di "${lastTopic}". Ci sono novità?`
          : `Com'è andata la giornata finora?`,
      };
    }

    if (hoursSinceLastChat < 72) {
      const days = Math.floor(hoursSinceLastChat / 24);
      return {
        greeting: `Hey! Sono passati ${days === 1 ? "un giorno" : `${days} giorni`}... `,
        followUp: lastTopic
          ? `Mi sono chiesto come fosse andata con "${lastTopic}". Tutto ok?`
          : `Come stai? Mi sei mancato/a!`,
      };
    }

    return {
      greeting: `Che bello risentirti dopo un po'! 💜`,
      followUp: `Mi fa piacere che sei tornato/a. Raccontami, come stai?`,
    };
  };

  const message = getMessage();

  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="flex justify-center my-6"
    >
      <div className="relative max-w-md">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-xl rounded-2xl" />
        
        <div className="relative glass rounded-2xl px-6 py-4 text-center border border-primary/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              {avatarName} ti ha pensato
            </span>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          
          <p className="text-sm text-foreground">
            {message.greeting}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {message.followUp}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
