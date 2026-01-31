import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";

export default function AdminUpload() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    source_video_url: "",
    voice_id: "",
    system_prompt: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.source_video_url || !formData.voice_id) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from("avatars")
        .insert({
          name: formData.name,
          source_video_url: formData.source_video_url,
          voice_id: formData.voice_id,
          system_prompt: formData.system_prompt || null,
        });

      if (error) throw error;

      toast.success("Avatar creato con successo!");
      setFormData({
        name: "",
        source_video_url: "",
        voice_id: "",
        system_prompt: "",
      });
    } catch (error: any) {
      console.error("Error creating avatar:", error);
      toast.error(error.message || "Errore durante la creazione dell'avatar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Indietro
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Carica Nuovo Avatar
            </CardTitle>
            <CardDescription>
              Inserisci i dati per creare un nuovo avatar per MuseTalk/Personaplex
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Avatar *</Label>
                <Input
                  id="name"
                  placeholder="Es. Marco, Sofia..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source_video_url">URL Video Sorgente (MP4) *</Label>
                <Input
                  id="source_video_url"
                  type="url"
                  placeholder="https://esempio.com/video.mp4"
                  value={formData.source_video_url}
                  onChange={(e) => setFormData({ ...formData, source_video_url: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  URL del video MP4 per MuseTalk
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voice_id">Voice ID (Personaplex) *</Label>
                <Input
                  id="voice_id"
                  placeholder="Es. voice_abc123..."
                  value={formData.voice_id}
                  onChange={(e) => setFormData({ ...formData, voice_id: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  ID della voce per Personaplex TTS
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="system_prompt">System Prompt (Personalità)</Label>
                <Textarea
                  id="system_prompt"
                  placeholder="Descrivi la personalità dell'avatar..."
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Opzionale: definisce come l'avatar si comporta nelle conversazioni
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creazione in corso...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Crea Avatar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
