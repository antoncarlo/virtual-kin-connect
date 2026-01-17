import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VisionResult {
  description: string;
  emotion: "surprised" | "interested" | "happy" | "thoughtful" | "neutral";
  suggestedResponse: string;
  objects: string[];
  people: number;
  mood: string;
}

export function useVisionProcessing(options?: {
  onResult?: (result: VisionResult) => void;
  onEmotionChange?: (emotion: VisionResult["emotion"]) => void;
  onError?: (error: Error) => void;
}) {
  const { onResult, onEmotionChange, onError } = options || {};

  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<VisionResult | null>(null);

  const analyzeImage = useCallback(async (imageFile: File | Blob): Promise<VisionResult | null> => {
    setIsProcessing(true);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/... prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      // Call vision analysis edge function
      const { data, error } = await supabase.functions.invoke('analyze-memory', {
        body: {
          imageBase64: base64,
          analysisType: 'realtime-reaction',
        },
      });

      if (error) throw error;

      // Parse the AI response into structured data
      const result = parseVisionResponse(data);
      
      setLastResult(result);
      onResult?.(result);
      onEmotionChange?.(result.emotion);

      return result;
    } catch (error) {
      console.error('Vision processing error:', error);
      onError?.(error as Error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [onResult, onEmotionChange, onError]);

  // Analyze a frame from video stream
  const analyzeVideoFrame = useCallback(async (video: HTMLVideoElement): Promise<VisionResult | null> => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0);
    
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (blob) {
          const result = await analyzeImage(blob);
          resolve(result);
        } else {
          resolve(null);
        }
      }, 'image/jpeg', 0.8);
    });
  }, [analyzeImage]);

  return {
    isProcessing,
    lastResult,
    analyzeImage,
    analyzeVideoFrame,
  };
}

// Parse the vision API response into structured format
function parseVisionResponse(data: any): VisionResult {
  // Default response
  const defaultResult: VisionResult = {
    description: "Ho visto qualcosa di interessante!",
    emotion: "interested",
    suggestedResponse: "Interessante! Dimmi di più su questa immagine.",
    objects: [],
    people: 0,
    mood: "curious",
  };

  if (!data) return defaultResult;

  try {
    // If the edge function returns structured data
    if (data.description || data.ai_description) {
      const description = data.description || data.ai_description || defaultResult.description;
      
      // Determine emotion based on content analysis
      let emotion: VisionResult["emotion"] = "neutral";
      const lowerDesc = description.toLowerCase();
      
      if (lowerDesc.includes("sorprendente") || lowerDesc.includes("incredibile") || lowerDesc.includes("wow")) {
        emotion = "surprised";
      } else if (lowerDesc.includes("bello") || lowerDesc.includes("felice") || lowerDesc.includes("sorriso")) {
        emotion = "happy";
      } else if (lowerDesc.includes("interessante") || lowerDesc.includes("curioso")) {
        emotion = "interested";
      } else if (lowerDesc.includes("profondo") || lowerDesc.includes("significativo")) {
        emotion = "thoughtful";
      }

      return {
        description,
        emotion,
        suggestedResponse: data.avatar_comment || generateResponse(description, emotion),
        objects: data.ai_objects || [],
        people: data.people_count || 0,
        mood: data.ai_emotions?.[0] || "curious",
      };
    }

    return defaultResult;
  } catch {
    return defaultResult;
  }
}

function generateResponse(description: string, emotion: VisionResult["emotion"]): string {
  const responses: Record<VisionResult["emotion"], string[]> = {
    surprised: [
      "Wow! Questa è davvero sorprendente!",
      "Non me l'aspettavo! Bellissimo!",
      "Che colpo di scena visivo!",
    ],
    interested: [
      "Interessante! Raccontami di più.",
      "Questo cattura la mia attenzione!",
      "Voglio saperne di più!",
    ],
    happy: [
      "Che bella immagine! Mi fa sorridere!",
      "Questo mi rende felice!",
      "Adoro quello che vedo!",
    ],
    thoughtful: [
      "Questo mi fa riflettere...",
      "C'è qualcosa di profondo qui.",
      "Lasciami elaborare quello che vedo.",
    ],
    neutral: [
      "Capisco cosa mi stai mostrando.",
      "Interessante prospettiva.",
      "Vedo cosa intendi.",
    ],
  };

  const options = responses[emotion];
  return options[Math.floor(Math.random() * options.length)];
}
