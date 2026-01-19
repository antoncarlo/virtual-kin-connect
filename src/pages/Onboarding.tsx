import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, ChevronLeft, Sparkles, Heart, 
  MessageCircle, Phone, Video, Check, Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { SafeSpaceSelector, themes, sounds } from "@/components/SafeSpaceSelector";
import kindredIcon from "@/assets/kindred-icon.png";

const steps = [
  {
    id: "welcome",
    title: "Welcome to Kindred",
    description: "Your journey to a safe, supportive space begins here.",
    icon: Sparkles,
  },
  {
    id: "safe-space",
    title: "Create Your Safe Space",
    description: "How do you imagine your perfect sanctuary? This will personalize your experience.",
    icon: Home,
  },
  {
    id: "features",
    title: "What You Can Do",
    description: "Unlimited chats, voice calls and video calls with companions who truly listen.",
    icon: Heart,
  },
  {
    id: "profile",
    title: "A Little About You",
    description: "Help us make conversations more personal. You can always change this later.",
    icon: MessageCircle,
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("forest");
  const [selectedSound, setSelectedSound] = useState("rain");

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Calculate trial end date (7 days from now)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      // Update profile with safe space preferences and trial
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName || null,
          bio: bio || null,
          has_completed_onboarding: true,
          safe_space_theme: selectedTheme,
          safe_space_sound: selectedSound,
          trial_started_at: new Date().toISOString(),
          trial_ends_at: trialEndsAt.toISOString(),
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Handle referral code if provided
      if (referralCode.trim()) {
        const { data: referral, error: referralError } = await supabase
          .from("referrals")
          .select("*")
          .eq("referral_code", referralCode.trim().toUpperCase())
          .eq("status", "pending")
          .single();

        if (referral && !referralError) {
          // Complete the referral
          await supabase
            .from("referrals")
            .update({
              referred_id: user.id,
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", referral.id);

          // Get referrer's current token balance and add bonus
          const { data: referrerProfile } = await supabase
            .from("profiles")
            .select("tokens_balance")
            .eq("user_id", referral.referrer_id)
            .single();

          if (referrerProfile) {
            await supabase
              .from("profiles")
              .update({ tokens_balance: referrerProfile.tokens_balance + 50 })
              .eq("user_id", referral.referrer_id);
          }

          // Give new user bonus tokens
          await supabase
            .from("profiles")
            .update({ tokens_balance: 100 })
            .eq("user_id", user.id);

          toast({
            title: "Referral code applied! 🎉",
            description: "You received 50 bonus tokens!",
          });
        }
      }

      const themeName = themes.find(t => t.id === selectedTheme)?.name || "your space";
      
      toast({
        title: "Your space is ready! ✨",
        description: `Welcome to ${themeName}. Your 7-day free trial has started.`,
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 grid-pattern">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={kindredIcon} alt="Kindred" className="w-16 h-16 mx-auto mb-4" />
          <div className="flex justify-center gap-2 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 w-12 rounded-full transition-colors ${
                  index <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass border-gradient rounded-2xl p-8"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Icon className="w-8 h-8 text-primary" />
              </div>

              <h1 className="text-2xl font-display font-bold mb-2">
                {currentStepData.title}
              </h1>
              <p className="text-muted-foreground text-sm">
                {currentStepData.description}
              </p>
            </div>

            {/* Step-specific content */}
            {currentStep === 0 && (
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 text-left">
                  <MessageCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm">Chat freely, anytime you need</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 text-left">
                  <Phone className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-sm">Voice calls when you want to talk</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 text-left">
                  <Video className="w-5 h-5 text-pink-500 flex-shrink-0" />
                  <span className="text-sm">Video calls with 3D companions</span>
                </div>
                <div className="text-center mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm font-medium text-primary">7-Day Free Trial</p>
                  <p className="text-xs text-muted-foreground">No credit card required</p>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="mb-6">
                <SafeSpaceSelector
                  selectedTheme={selectedTheme}
                  selectedSound={selectedSound}
                  onThemeChange={setSelectedTheme}
                  onSoundChange={setSelectedSound}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { icon: MessageCircle, label: "Chat", color: "text-primary" },
                  { icon: Phone, label: "Voice", color: "text-accent" },
                  { icon: Video, label: "Video", color: "text-pink-500" },
                ].map((feature) => (
                  <div key={feature.label} className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center mx-auto mb-2">
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <span className="text-xs text-muted-foreground">{feature.label}</span>
                  </div>
                ))}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4 mb-8 text-left">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    What should we call you?
                  </label>
                  <Input
                    placeholder="Your name or nickname"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-secondary/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Something about you (optional)
                  </label>
                  <Input
                    placeholder="E.g., I love music and travel"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-secondary/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Referral code (optional)
                  </label>
                  <Input
                    placeholder="E.g., ABC123"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="bg-secondary/50"
                    maxLength={10}
                  />
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} className="flex-1 gradient-primary">
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button 
                  onClick={handleComplete} 
                  className="flex-1 gradient-primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating your space..." : "Enter My Space"}
                  <Check className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Skip button */}
        {currentStep < steps.length - 1 && (
          <Button
            variant="ghost"
            className="w-full mt-4 text-muted-foreground"
            onClick={() => setCurrentStep(steps.length - 1)}
          >
            Skip to profile
          </Button>
        )}
      </motion.div>
    </div>
  );
}
