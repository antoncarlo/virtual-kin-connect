import { useState } from "react";
import { motion } from "framer-motion";
import { User, Camera, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface ProfileSettingsProps {
  user: SupabaseUser | null;
  profile: any;
  onProfileUpdate: () => void;
}

export function ProfileSettings({ user, profile, onProfileUpdate }: ProfileSettingsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || user?.user_metadata?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          bio: bio,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
      onProfileUpdate();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass border-gradient rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <User className="w-5 h-5" /> Profile Information
      </h3>

      <div className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20 border-2 border-primary/30">
            <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Profile photo</p>
            <Button variant="outline" size="sm" className="gap-2" disabled>
              <Camera className="w-4 h-4" /> Change photo
            </Button>
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={user?.email || ""}
            disabled
            className="bg-secondary/50"
          />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={3}
          />
        </div>

        <Button onClick={handleSaveProfile} disabled={isLoading} className="gradient-primary">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </motion.div>
  );
}
