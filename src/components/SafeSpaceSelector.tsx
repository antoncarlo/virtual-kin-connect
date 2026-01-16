import { motion } from "framer-motion";
import { Check, Trees, Waves, Mountain, CloudRain, Flower2, BookOpen, Flame, Coffee, Stars, Sun, Cloud, Sparkles } from "lucide-react";

export interface SafeSpaceTheme {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  category: "nature" | "indoor" | "abstract";
}

export interface SafeSpaceSound {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const themes: SafeSpaceTheme[] = [
  // Nature
  { id: "forest", name: "Quiet Forest", icon: Trees, gradient: "from-green-500/20 to-emerald-500/20", category: "nature" },
  { id: "beach", name: "Sunset Beach", icon: Waves, gradient: "from-orange-500/20 to-pink-500/20", category: "nature" },
  { id: "mountains", name: "Mountain Peak", icon: Mountain, gradient: "from-slate-500/20 to-blue-500/20", category: "nature" },
  { id: "rain", name: "Rainy Day", icon: CloudRain, gradient: "from-blue-500/20 to-indigo-500/20", category: "nature" },
  { id: "garden", name: "Flower Garden", icon: Flower2, gradient: "from-pink-500/20 to-rose-500/20", category: "nature" },
  // Indoor
  { id: "library", name: "Cozy Library", icon: BookOpen, gradient: "from-amber-500/20 to-orange-500/20", category: "indoor" },
  { id: "fireplace", name: "By the Fireplace", icon: Flame, gradient: "from-red-500/20 to-orange-500/20", category: "indoor" },
  { id: "cafe", name: "Quiet Café", icon: Coffee, gradient: "from-amber-700/20 to-yellow-500/20", category: "indoor" },
  // Abstract
  { id: "stars", name: "Starry Night", icon: Stars, gradient: "from-indigo-500/20 to-purple-500/20", category: "abstract" },
  { id: "aurora", name: "Northern Lights", icon: Sparkles, gradient: "from-green-500/20 to-blue-500/20", category: "abstract" },
  { id: "clouds", name: "Above the Clouds", icon: Cloud, gradient: "from-sky-500/20 to-white/20", category: "abstract" },
  { id: "sunrise", name: "Golden Sunrise", icon: Sun, gradient: "from-yellow-500/20 to-orange-500/20", category: "abstract" },
];

export const sounds: SafeSpaceSound[] = [
  { id: "rain", name: "Gentle Rain", icon: CloudRain },
  { id: "waves", name: "Ocean Waves", icon: Waves },
  { id: "forest", name: "Forest Birds", icon: Trees },
  { id: "fire", name: "Crackling Fire", icon: Flame },
  { id: "silence", name: "Peaceful Silence", icon: Stars },
];

interface SafeSpaceSelectorProps {
  selectedTheme: string;
  selectedSound: string;
  onThemeChange: (theme: string) => void;
  onSoundChange: (sound: string) => void;
}

export function SafeSpaceSelector({
  selectedTheme,
  selectedSound,
  onThemeChange,
  onSoundChange,
}: SafeSpaceSelectorProps) {
  const categories = [
    { id: "nature", name: "Nature" },
    { id: "indoor", name: "Indoor" },
    { id: "abstract", name: "Abstract" },
  ];

  return (
    <div className="space-y-8">
      {/* Theme Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Your Space</h3>
        <p className="text-sm text-muted-foreground mb-4">
          How do you imagine your safe place?
        </p>
        
        {categories.map((category) => (
          <div key={category.id} className="mb-4">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {category.name}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {themes
                .filter((t) => t.category === category.id)
                .map((theme) => {
                  const Icon = theme.icon;
                  const isSelected = selectedTheme === theme.id;
                  
                  return (
                    <motion.button
                      key={theme.id}
                      onClick={() => onThemeChange(theme.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative p-3 rounded-xl border transition-all text-left ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border/50 hover:border-primary/30 bg-card"
                      }`}
                    >
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${theme.gradient} opacity-50`} />
                      <div className="relative flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-sm font-medium truncate">{theme.name}</span>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="ml-auto"
                          >
                            <Check className="w-4 h-4 text-primary" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Sound Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Ambient Sounds</h3>
        <p className="text-sm text-muted-foreground mb-4">
          What sounds help you relax?
        </p>
        
        <div className="flex flex-wrap gap-2">
          {sounds.map((sound) => {
            const Icon = sound.icon;
            const isSelected = selectedSound === sound.id;
            
            return (
              <motion.button
                key={sound.id}
                onClick={() => onSoundChange(sound.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 hover:border-primary/30"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{sound.name}</span>
                {isSelected && <Check className="w-3 h-3" />}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
