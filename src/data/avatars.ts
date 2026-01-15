import marcoImg from "@/assets/avatars/marco-new.jpg";
import sofiaImg from "@/assets/avatars/sofia-new.jpg";
import alexImg from "@/assets/avatars/alex-new.jpg";
import lunaImg from "@/assets/avatars/luna-new.jpg";
import leoImg from "@/assets/avatars/leo-new.jpg";
import emmaImg from "@/assets/avatars/emma-new.jpg";

export interface Avatar {
  id: string;
  name: string;
  role: string;
  tagline: string;
  description: string;
  personality: string[];
  imageUrl: string;
  vapiAssistantId?: string; // Vapi.ai Assistant ID for calls
  rpmAvatarUrl?: string; // ReadyPlayerMe 3D avatar URL
  gradient: string;
}

export const avatars: Avatar[] = [
  {
    id: "marco",
    name: "Marco",
    role: "Il Migliore Amico",
    tagline: "Always there for you",
    description: "Marco è il compagno perfetto per ogni momento. Divertente, leale e sempre pronto ad ascoltarti. Che tu voglia ridere o sfogarti, lui c'è.",
    personality: ["Supportive", "Funny", "Loyal", "Adventurous"],
    imageUrl: marcoImg,
    vapiAssistantId: "b081bf08-44cf-42eb-b842-1211a1bcb5cc",
    rpmAvatarUrl: "https://models.readyplayer.me/64f0265e8d5a8ed7ed439e9f.glb?morphTargets=ARKit,Oculus Visemes",
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
    vapiAssistantId: "1898ee39-ba59-403b-ad47-047b81479ccd",
    rpmAvatarUrl: "https://models.readyplayer.me/64f02727f65de82da87b2619.glb?morphTargets=ARKit,Oculus Visemes",
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
    vapiAssistantId: "2c460d20-3257-4075-8c9a-837f5c513b1e",
    rpmAvatarUrl: "https://models.readyplayer.me/64f0265e8d5a8ed7ed439e9f.glb?morphTargets=ARKit,Oculus Visemes",
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
    vapiAssistantId: "e0896441-d73d-4505-9c30-ea81ce0c4985",
    rpmAvatarUrl: "https://models.readyplayer.me/64f02727f65de82da87b2619.glb?morphTargets=ARKit,Oculus Visemes",
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
    vapiAssistantId: "2cdd0774-320e-467d-90a1-d2baf56adf11",
    rpmAvatarUrl: "https://models.readyplayer.me/64f0265e8d5a8ed7ed439e9f.glb?morphTargets=ARKit,Oculus Visemes",
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
    vapiAssistantId: "1e84c844-5196-4a7d-96bf-9b80cdce4e9c",
    rpmAvatarUrl: "https://models.readyplayer.me/64f02727f65de82da87b2619.glb?morphTargets=ARKit,Oculus Visemes",
    gradient: "from-rose-400 to-pink-400",
  },
];
