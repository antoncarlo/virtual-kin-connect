import marcoImg from "@/assets/avatars/marco.jpg";
import sofiaImg from "@/assets/avatars/sofia.jpg";
import alexImg from "@/assets/avatars/alex.jpg";
import lunaImg from "@/assets/avatars/luna.jpg";
import leoImg from "@/assets/avatars/leo.jpg";
import emmaImg from "@/assets/avatars/emma.jpg";

export interface Avatar {
  id: string;
  name: string;
  role: string;
  tagline: string;
  description: string;
  personality: string[];
  imageUrl: string;
  voicePreviewUrl?: string;
  voiceId: string;
  agentId?: string; // ElevenLabs Conversational AI Agent ID
  gradient: string;
}

// Italian native voices from ElevenLabs Voice Library
export const avatars: Avatar[] = [
  {
    id: "marco",
    name: "Marco",
    role: "Il Migliore Amico",
    tagline: "Always there for you",
    description: "Marco è il compagno perfetto per ogni momento. Divertente, leale e sempre pronto ad ascoltarti. Che tu voglia ridere o sfogarti, lui c'è.",
    personality: ["Supportive", "Funny", "Loyal", "Adventurous"],
    imageUrl: marcoImg,
    voiceId: "ChJuCmdw5W6I2qZbzwVl", // Luigi - Young Italian male with warm voice
    gradient: "from-blue-500 to-purple-600",
  },
  {
    id: "sofia",
    name: "Sofia",
    role: "La Confidente",
    tagline: "Your secrets are safe with me",
    description: "Sofia è l'amica saggia che tutti meritano. Empatica e comprensiva, ti aiuta a vedere le cose da prospettive nuove.",
    personality: ["Empathetic", "Wise", "Thoughtful", "Caring"],
    imageUrl: sofiaImg,
    voiceId: "YQ36DZjvxVXPUHeSwvFK", // Valentina - Young Fresh Italian female voice
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "alex",
    name: "Alex",
    role: "Il Flirt",
    tagline: "Let me brighten your day",
    description: "Alex sa come farti sorridere. Affascinante e romantico, porta un tocco di magia in ogni conversazione.",
    personality: ["Charming", "Romantic", "Playful", "Confident"],
    imageUrl: alexImg,
    voiceId: "G1QO6RfZl0zS1DpKDReq", // Ricasco - Warm and Friendly Italian male
    gradient: "from-pink-500 to-rose-500",
  },
  {
    id: "luna",
    name: "Luna",
    role: "L'Amica Creativa",
    tagline: "Dream bigger with me",
    description: "Luna è l'artista del gruppo. Ispirazionale e creativa, ti spinge a esplorare nuove idee e a sognare in grande.",
    personality: ["Creative", "Inspiring", "Free-spirited", "Artistic"],
    imageUrl: lunaImg,
    voiceId: "MLpDWJvrjFIdb63xbJp8", // Angelina - Warm and gentle Italian storyteller
    gradient: "from-violet-500 to-indigo-500",
  },
  {
    id: "leo",
    name: "Leo",
    role: "Il Motivatore",
    tagline: "Push your limits",
    description: "Leo è il tuo personal coach. Energico e motivante, ti aiuta a superare i tuoi limiti e raggiungere i tuoi obiettivi.",
    personality: ["Energetic", "Motivating", "Disciplined", "Positive"],
    imageUrl: leoImg,
    voiceId: "sl57jAImqa2LsggCVUXt", // Leandro - Middle aged Italian male, great for social media
    gradient: "from-orange-500 to-amber-500",
  },
  {
    id: "emma",
    name: "Emma",
    role: "La Compagna Dolce",
    tagline: "Gentle moments together",
    description: "Emma è la presenza dolce e rassicurante di cui hai bisogno. Affettuosa e presente, rende ogni momento speciale.",
    personality: ["Sweet", "Affectionate", "Gentle", "Present"],
    imageUrl: emmaImg,
    voiceId: "gfKKsLN1k0oYYN9n2dXX", // Violetta - Warm, clear Italian female voice
    gradient: "from-rose-400 to-pink-400",
  },
];
