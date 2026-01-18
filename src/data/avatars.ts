import marcoImg from "@/assets/avatars/marco-new.jpg";
import sofiaImg from "@/assets/avatars/sofia-new.jpg";

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
  heygenAvatarId?: string;
  heygenVoiceId?: string;
  gradient: string;
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
    // Updated: Multilingual v2 assistant with auto-language detection
    vapiAssistantId: "36638539-4add-4e0a-9c14-e250c41b333c",
    rpmAvatarUrl: "https://models.readyplayer.me/64f0265e8d5a8ed7ed439e9f.glb?morphTargets=ARKit,Oculus Visemes",
    heygenAvatarId: "ad933deb045a4effa9ddb43ae4af091a",
    heygenVoiceId: "it-IT-DiegoNeural",
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
    // Updated: Multilingual v2 assistant with auto-language detection
    vapiAssistantId: "a5138f3d-84c0-4c33-8c53-8eafd4bf9264",
    rpmAvatarUrl: "https://models.readyplayer.me/64f02727f65de82da87b2619.glb?morphTargets=ARKit,Oculus Visemes",
    heygenAvatarId: "ann_lite_20230714",
    heygenVoiceId: "it-IT-ElsaNeural",
    gradient: "from-purple-500 to-pink-500",
  },
];
