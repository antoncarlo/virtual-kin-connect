import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  Heart, 
  Book, 
  Coffee, 
  Star, 
  Lock,
  Sparkles,
  Calendar
} from "lucide-react";
import { AvatarIdentity, UserAvatarAffinity } from "@/hooks/useAvatarIdentity";
import { Progress } from "@/components/ui/progress";

interface AboutAvatarPanelProps {
  identity: AvatarIdentity | null;
  affinity: UserAvatarAffinity | null;
  unlockedSecrets: string[];
  isOpen: boolean;
  onClose: () => void;
  avatarImage?: string;
}

export function AboutAvatarPanel({
  identity,
  affinity,
  unlockedSecrets,
  isOpen,
  onClose,
  avatarImage,
}: AboutAvatarPanelProps) {
  if (!identity) return null;

  const affinityProgress = affinity ? (affinity.affinity_level / 10) * 100 : 0;
  const totalSecrets = identity.deep_secrets?.length || 0;
  const unlockedCount = unlockedSecrets.length;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-gradient-to-b from-background via-background to-muted/30 z-50 overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="relative">
              <div className="h-48 bg-gradient-to-br from-primary/30 via-purple-500/20 to-pink-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),transparent)]" />
                {avatarImage && (
                  <img
                    src={avatarImage}
                    alt={identity.name}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full border-4 border-background object-cover translate-y-1/2"
                  />
                )}
              </div>
              
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pt-20 pb-8 space-y-6">
              {/* Name & Basic Info */}
              <div className="text-center">
                <h2 className="text-2xl font-bold">{identity.name}</h2>
                <p className="text-muted-foreground flex items-center justify-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  {identity.age} anni
                  {identity.birthdate && (
                    <span className="text-sm">• Nato il {formatDate(identity.birthdate)}</span>
                  )}
                </p>
                {identity.birthplace && (
                  <p className="text-muted-foreground flex items-center justify-center gap-2 mt-1">
                    <MapPin className="w-4 h-4" />
                    {identity.birthplace}
                  </p>
                )}
              </div>

              {/* Affinity Level */}
              <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span className="font-medium">Livello di Affinità</span>
                  </div>
                  <span className="text-primary font-bold">{affinity?.affinity_level || 1}/10</span>
                </div>
                <Progress value={affinityProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {affinity?.total_messages || 0} messaggi • {affinity?.total_call_minutes || 0} minuti di chiamata
                </p>
              </div>

              {/* Personality Traits */}
              {identity.personality_traits && identity.personality_traits.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Personalità
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {identity.personality_traits.map((trait, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {identity.education && (
                <div className="bg-card/30 rounded-lg p-4 border border-border/30">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-500" />
                    Formazione
                  </h3>
                  <p className="font-medium">{identity.education}</p>
                  {identity.education_story && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      "{identity.education_story}"
                    </p>
                  )}
                </div>
              )}

              {/* Past Occupations */}
              {identity.past_occupations && identity.past_occupations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-orange-500" />
                    Esperienze Passate
                  </h3>
                  <ul className="space-y-2">
                    {identity.past_occupations.map((job, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary">•</span>
                        {job}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Relationship */}
              {identity.relationship_status && (
                <div className="bg-card/30 rounded-lg p-4 border border-border/30">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    Stato Sentimentale
                  </h3>
                  <p className="font-medium">{identity.relationship_status}</p>
                  {identity.relationship_story && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      "{identity.relationship_story}"
                    </p>
                  )}
                </div>
              )}

              {/* Favorites */}
              <div className="grid grid-cols-2 gap-4">
                {identity.favorite_book && (
                  <div className="bg-card/30 rounded-lg p-4 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Book className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium">Libro Preferito</span>
                    </div>
                    <p className="text-sm">{identity.favorite_book}</p>
                  </div>
                )}
                {identity.favorite_coffee && (
                  <div className="bg-card/30 rounded-lg p-4 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Coffee className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium">Caffè Preferito</span>
                    </div>
                    <p className="text-sm">{identity.favorite_coffee}</p>
                  </div>
                )}
              </div>

              {/* Loves & Hates */}
              <div className="grid grid-cols-2 gap-4">
                {identity.loves && identity.loves.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-500 mb-2">❤️ Ama</h4>
                    <ul className="space-y-1">
                      {identity.loves.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {identity.hates && identity.hates.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-500 mb-2">💔 Odia</h4>
                    <ul className="space-y-1">
                      {identity.hates.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Deep Secrets */}
              {totalSecrets > 0 && (
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-400" />
                    Segreti Profondi
                    <span className="text-xs text-muted-foreground ml-auto">
                      {unlockedCount}/{totalSecrets} sbloccati
                    </span>
                  </h3>
                  
                  <div className="space-y-3">
                    {identity.deep_secrets.map((secret, i) => {
                      const isUnlocked = secret.level <= (affinity?.affinity_level || 1);
                      return (
                        <div
                          key={i}
                          className={`p-3 rounded-lg ${
                            isUnlocked
                              ? "bg-card/50 border border-purple-500/30"
                              : "bg-black/20 border border-border/30"
                          }`}
                        >
                          {isUnlocked ? (
                            <p className="text-sm italic">"{secret.secret}"</p>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Lock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Sblocca al livello {secret.level}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Formative Story */}
              {identity.formative_story && (
                <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl p-4 border border-blue-500/20">
                  <h3 className="font-semibold mb-3">La Sua Storia</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {identity.formative_story}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
