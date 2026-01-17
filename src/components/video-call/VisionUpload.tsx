import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Upload, X, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVisionProcessing, VisionResult } from "@/hooks/useVisionProcessing";

interface VisionUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (result: VisionResult) => void;
  onEmotionChange: (emotion: VisionResult["emotion"]) => void;
}

export function VisionUpload({ isOpen, onClose, onResult, onEmotionChange }: VisionUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isProcessing, analyzeImage } = useVisionProcessing({
    onResult,
    onEmotionChange,
  });

  const handleFileSelect = useCallback(async (file: File) => {
    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Analyze
    const result = await analyzeImage(file);
    
    if (result) {
      // Auto-close after showing result
      setTimeout(() => {
        setPreview(null);
        onClose();
      }, 2000);
    }
  }, [analyzeImage, onClose]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-80 z-30"
        >
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Image className="w-4 h-4 text-primary" />
                Condividi immagine
              </h4>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-white/60 hover:text-white"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                      <p className="text-white text-sm">Analizzo l'immagine...</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="w-8 h-8 text-white/40 mx-auto mb-2" />
                <p className="text-white/60 text-sm">
                  Trascina o clicca per caricare
                </p>
                <p className="text-white/40 text-xs mt-1">
                  JPG, PNG, GIF
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />

            <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Marco reagirà all'immagine in tempo reale</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
