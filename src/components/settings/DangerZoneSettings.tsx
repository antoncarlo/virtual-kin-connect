import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-client";
import { useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";

interface DangerZoneSettingsProps {
  user: User | null;
}

export function DangerZoneSettings({ user }: DangerZoneSettingsProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteAllData = async () => {
    if (!user || confirmText !== "DELETE") return;
    
    setIsDeleting(true);

    try {
      // Delete all user data from various tables
      await supabase.from("chat_messages").delete().eq("user_id", user.id);
      await supabase.from("session_insights").delete().eq("user_id", user.id);
      await supabase.from("session_summaries").delete().eq("user_id", user.id);
      await supabase.from("user_context").delete().eq("user_id", user.id);
      await supabase.from("temporal_goals").delete().eq("user_id", user.id);
      await supabase.from("social_graph").delete().eq("user_id", user.id);
      await supabase.from("pending_knowledge").delete().eq("user_id", user.id);
      await supabase.from("interaction_feedback").delete().eq("user_id", user.id);
      await supabase.from("crisis_logs").delete().eq("user_id", user.id);
      await supabase.from("favorites").delete().eq("user_id", user.id);
      await supabase.from("ratings").delete().eq("user_id", user.id);
      await supabase.from("shared_memories").delete().eq("user_id", user.id);
      await supabase.from("user_avatar_affinity").delete().eq("user_id", user.id);
      await supabase.from("referrals").delete().eq("referrer_id", user.id);

      // Delete profile
      await supabase.from("profiles").delete().eq("user_id", user.id);

      toast({
        title: "All data deleted",
        description: "Your data has been permanently removed.",
      });

      // Sign out and redirect
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error deleting data:", error);
      toast({
        title: "Error",
        description: "Failed to delete some data. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass rounded-xl p-6 border-2 border-destructive/30"
    >
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-destructive">
        <AlertTriangle className="w-5 h-5" /> Danger Zone
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        These actions are irreversible. Please proceed with caution.
      </p>

      <div className="space-y-4">
        {/* Delete All Data */}
        <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-medium text-destructive">Delete All Your Data</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete all your conversations, memories, goals, and personal data. 
                This cannot be undone.
              </p>
            </div>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="shrink-0 gap-2">
                  <Trash2 className="w-4 h-4" /> Delete All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>
                      This action <strong>cannot be undone</strong>. This will permanently delete:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>All your chat conversations</li>
                      <li>Shared memories and photos</li>
                      <li>Goals and progress tracking</li>
                      <li>Session insights and analytics</li>
                      <li>All personal data and preferences</li>
                    </ul>
                    <div className="pt-3">
                      <Label htmlFor="confirmDelete" className="text-foreground">
                        Type <strong>DELETE</strong> to confirm:
                      </Label>
                      <Input
                        id="confirmDelete"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="DELETE"
                        className="mt-2"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmText("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAllData}
                    disabled={confirmText !== "DELETE" || isDeleting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
