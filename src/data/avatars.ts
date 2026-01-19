import marcoImg from "@/assets/avatars/marco-realistic.jpg";
import sofiaImg from "@/assets/avatars/sofia-realistic.jpg";
import {
  HEYGEN_AVATARS,
  HEYGEN_VOICES,
  SupportedLanguage,
  getHeyGenVoiceId
} from "@/lib/multilingual";

export interface Avatar {
  id: string;
  name: string;
  role: string;
  tagline: string;
  description: string;
  personality: string[];
  imageUrl: string;
  vapiAssistantId?: string;
  rpmAvatarUrl?: string;
  // HeyGen configuration
  heygenAvatarId?: string;
  heygenGender: 'male' | 'female';
  // Dynamic voice - use getVoiceIdForLanguage()
  defaultVoiceId?: string;
  gradient: string;
}

// Get voice ID for avatar based on detected language
export function getVoiceIdForAvatar(avatar: Avatar, language: SupportedLanguage): string {
  return getHeyGenVoiceId(avatar.heygenGender, language);
}

export const avatars: Avatar[] = [
  {
    id: "marco",
    name: "Marco",
    role: "Best Friend",
    tagline: "Always there for you",
    description: "Marco is the perfect companion for every moment. Funny, loyal, and always ready to listen. Whether you want to laugh or vent, he's there.",
    personality: ["Supportive", "Funny", "Loyal", "Adventurous"],
    imageUrl: marcoImg,
    // VAPI Multilingual v2 assistant with auto-language detection
    vapiAssistantId: "36638539-4add-4e0a-9c14-e250c41b333c",
    rpmAvatarUrl: "https://models.readyplayer.me/64f0265e8d5a8ed7ed439e9f.glb?morphTargets=ARKit,Oculus Visemes",
    // HeyGen configuration - Male avatar
    heygenAvatarId: HEYGEN_AVATARS.MARCO.avatarId,
    heygenGender: 'male',
    defaultVoiceId: HEYGEN_VOICES.it.male,
    gradient: "from-blue-500 to-purple-600",
  },
  {
    id: "sofia",
    name: "Sofia",
    role: "The Confidant",
    tagline: "Your secrets are safe with me",
    description: "Sofia is the wise friend everyone deserves. Empathetic and understanding, she helps you see things from new perspectives.",
    personality: ["Empathetic", "Wise", "Thoughtful", "Caring"],
    imageUrl: sofiaImg,
    // VAPI Multilingual v2 assistant with auto-language detection
    vapiAssistantId: "a5138f3d-84c0-4c33-8c53-8eafd4bf9264",
    rpmAvatarUrl: "https://models.readyplayer.me/64f02727f65de82da87b2619.glb?morphTargets=ARKit,Oculus Visemes",
    // HeyGen configuration - Female avatar (FIXED!)
    heygenAvatarId: HEYGEN_AVATARS.SOFIA.avatarId,
    heygenGender: 'female',
    defaultVoiceId: HEYGEN_VOICES.it.female,
    gradient: "from-purple-500 to-pink-500",
  },
];

// Helper to get avatar by ID
export function getAvatarById(avatarId: string): Avatar | undefined {
  return avatars.find(a => a.id === avatarId);
}

// Get avatar's greeting based on personality
export function getAvatarGreeting(avatar: Avatar, language: SupportedLanguage): string {
  const greetings: Record<string, Record<SupportedLanguage, string>> = {
    marco: {
      auto: "Ehi! Finalmente ci vediamo! Come stai?",
      it: "Ehi! Finalmente ci vediamo! Come stai?",
      en: "Hey! Finally we meet! How are you?",
      es: "¡Hey! ¡Por fin nos vemos! ¿Cómo estás?",
      fr: "Hey! Enfin on se voit! Comment vas-tu?",
      de: "Hey! Endlich sehen wir uns! Wie geht's dir?",
      pt: "Ei! Finalmente nos vemos! Como você está?",
    },
    sofia: {
      auto: "Ciao! Che bello vederti. Come ti senti oggi?",
      it: "Ciao! Che bello vederti. Come ti senti oggi?",
      en: "Hi! So nice to see you. How are you feeling today?",
      es: "¡Hola! Qué bueno verte. ¿Cómo te sientes hoy?",
      fr: "Salut! C'est si bon de te voir. Comment te sens-tu aujourd'hui?",
      de: "Hallo! Schön dich zu sehen. Wie fühlst du dich heute?",
      pt: "Oi! Que bom te ver. Como você está se sentindo hoje?",
    },
  };

  return greetings[avatar.id]?.[language] || greetings[avatar.id]?.it || "Ciao!";
}
