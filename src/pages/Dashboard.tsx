import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, MessageCircle, Phone, Settings, LogOut, Loader2, 
  Zap, Crown, ChevronRight, History, CreditCard, Bell,
  Home, Menu, X, Sparkles, Video, Heart, Gift, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AvatarCard } from "@/components/AvatarCard";
import { avatars, type Avatar as AvatarType } from "@/data/avatars";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useFavorites } from "@/hooks/useFavorites";
import { useSessionInsights } from "@/hooks/useSessionInsights";
import { useReferrals } from "@/hooks/useReferrals";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { UserInsights } from "@/components/dashboard/UserInsights";
import { GoalsProgress } from "@/components/dashboard/GoalsProgress";
import { PremiumAvatarCard } from "@/components/dashboard/PremiumAvatarCard";
import { SubscriptionWidget } from "@/components/dashboard/SubscriptionWidget";
import type { User } from "@supabase/supabase-js";
import kindredIcon from "@/assets/kindred-icon.png";

type TabType = "home" | "avatars" | "history" | "tokens" | "settings";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { profile } = useProfile();
  const { favorites } = useFavorites();
  const { insights } = useSessionInsights();
  const { referralCode, referrals, generateReferralCode, getTotalBonusTokens } = useReferrals();

  // Get token balance from profile
  const tokenBalance = profile?.tokens_balance || 0;
  const plan = profile?.subscription_tier || "Free";
  
  // Calculate trial days remaining
  const trialDaysRemaining = profile?.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 7;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          navigate("/login");
        } else {
          setUser(session.user);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      } else {
        setUser(session.user);
        fetchMessageCount(session.user.id);
        fetchTotalDuration(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchMessageCount = async (userId: string) => {
    const { count } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    setMessageCount(count || 0);
  };

  const fetchTotalDuration = async (userId: string) => {
    const { data } = await supabase
      .from("session_insights")
      .select("duration_seconds")
      .eq("user_id", userId);
    
    if (data) {
      const totalSeconds = data.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
      setTotalMinutes(Math.floor(totalSeconds / 60));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "See you soon!",
    });
  };

  const handleSelectAvatar = (avatar: AvatarType) => {
    navigate(`/chat/${avatar.id}`);
  };

  const navItems = [
    { id: "home" as TabType, label: "Home", icon: Home },
    { id: "avatars" as TabType, label: "My Avatars", icon: Users },
    { id: "history" as TabType, label: "History", icon: History },
    { id: "tokens" as TabType, label: "Tokens", icon: Zap },
    { id: "settings" as TabType, label: "Settings", icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <img src={kindredIcon} alt="Kindred" className="w-16 h-16 animate-pulse" />
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25 }}
            className={`fixed lg:static inset-y-0 left-0 z-40 w-[280px] glass border-r border-border flex flex-col ${
              sidebarOpen ? "block" : "hidden lg:flex"
            }`}
          >
            {/* Logo */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <img src={kindredIcon} alt="Kindred" className="w-10 h-10" />
                <span className="text-xl font-display font-bold text-gradient">
                  Kindred
                </span>
              </div>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-primary/30">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
                  </p>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      {plan}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Token Balance */}
              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Available tokens</span>
                  <Zap className="w-4 h-4 text-gold" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{tokenBalance}</span>
                  <span className="text-xs text-muted-foreground">tokens</span>
                </div>
                <Progress value={tokenBalance / 5} className="mt-2 h-1" />
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              {navItems.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.id === "tokens" && (
                    <Badge className="ml-auto bg-gold/20 text-gold border-gold/30">
                      {tokenBalance}
                    </Badge>
                  )}
                </motion.button>
              ))}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Log Out
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8 lg:px-8">
          <AnimatePresence mode="wait">
            {activeTab === "home" && (
              <HomeTab 
                key="home"
                user={user} 
                messageCount={messageCount}
                totalMinutes={totalMinutes}
                tokenBalance={tokenBalance}
                plan={plan}
                trialDaysRemaining={trialDaysRemaining}
                insights={insights}
                onSelectAvatar={handleSelectAvatar}
                onUpgrade={() => setShowSubscriptionModal(true)}
                favorites={favorites}
                onNavigateToTokens={() => setActiveTab("tokens")}
              />
            )}
            {activeTab === "avatars" && (
              <AvatarsTab 
                key="avatars"
                onSelectAvatar={handleSelectAvatar}
                favorites={favorites}
              />
            )}
            {activeTab === "history" && (
              <HistoryTab key="history" insights={insights} />
            )}
            {activeTab === "tokens" && (
              <TokensTab 
                key="tokens" 
                tokenBalance={tokenBalance}
                referralCode={referralCode}
                referrals={referrals}
                onGenerateCode={generateReferralCode}
                totalBonusTokens={getTotalBonusTokens()}
              />
            )}
            {activeTab === "settings" && (
              <SettingsTab 
                key="settings" 
                user={user} 
                profile={profile} 
                onUpgrade={() => setShowSubscriptionModal(true)}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
      
      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        currentPlan={plan}
      />
    </div>
  );
}

// Home Tab Component - Redesigned
function HomeTab({ 
  user, 
  messageCount,
  totalMinutes,
  tokenBalance,
  plan,
  trialDaysRemaining,
  insights,
  onSelectAvatar,
  onUpgrade,
  favorites,
  onNavigateToTokens,
}: { 
  user: User | null;
  messageCount: number;
  totalMinutes: number;
  tokenBalance: number;
  plan: string;
  trialDaysRemaining: number;
  insights: any[];
  onSelectAvatar: (avatar: AvatarType) => void;
  onUpgrade: () => void;
  favorites: string[];
  onNavigateToTokens: () => void;
}) {
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Friend";
  
  // Generate mock mood data from insights
  const moodData = generateMoodData(insights);
  
  // Get last advice from insights
  const lastAdvice = insights.length > 0 ? insights[0]?.summary : null;
  
  // Get avatar statuses
  const getAvatarStatus = (avatarId: string): "ready" | "reflecting" | "listening" => {
    const hasRecentChat = insights.some(
      i => i.avatar_id === avatarId && 
      new Date(i.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    return hasRecentChat ? "reflecting" : "ready";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Dynamic Header */}
      <DashboardHeader user={user} displayName={displayName} />

      {/* Subscription Widget */}
      <SubscriptionWidget
        plan={plan}
        trialDaysRemaining={trialDaysRemaining}
        tokensBalance={tokenBalance}
        onUpgrade={onNavigateToTokens}
      />

      {/* User Insights */}
      <UserInsights
        totalConversations={insights.length}
        totalMinutes={totalMinutes}
        moodData={moodData}
      />

      {/* Goals Progress */}
      <GoalsProgress lastAdvice={lastAdvice} userId={user?.id} />

      {/* Premium Avatar Cards */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-display font-semibold text-foreground">Your Kindred</h2>
            <p className="text-sm text-muted-foreground">Start a conversation with your AI companions</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {avatars.map((avatar, index) => (
            <PremiumAvatarCard
              key={avatar.id}
              avatar={avatar}
              onSelect={onSelectAvatar}
              status={getAvatarStatus(avatar.id)}
              index={index}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Helper function to generate mood data from insights
function generateMoodData(insights: any[]) {
  const days = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
  const moodMap: { [key: string]: number } = {
    happy: 9,
    content: 8,
    calm: 7,
    peaceful: 7,
    reflective: 6,
    neutral: 5,
    anxious: 4,
    sad: 3,
    stressed: 3,
  };

  return days.map((day, index) => {
    const dayInsights = insights.filter(i => {
      const date = new Date(i.created_at);
      return date.getDay() === (index + 1) % 7;
    });
    
    const avgMood = dayInsights.length > 0
      ? dayInsights.reduce((sum, i) => sum + (moodMap[i.mood?.toLowerCase()] || 6), 0) / dayInsights.length
      : 6 + Math.random() * 2;

    return {
      day,
      mood: Math.round(avgMood * 10) / 10,
      label: dayInsights[0]?.mood || "Balanced",
    };
  });
}

// Avatars Tab
function AvatarsTab({ onSelectAvatar, favorites }: { onSelectAvatar: (avatar: AvatarType) => void; favorites: string[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">My Avatars</h1>
        <p className="text-muted-foreground">Choose a companion to start a conversation</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {avatars.map((avatar, index) => (
          <AvatarCard key={avatar.id} avatar={avatar} index={index} onSelect={onSelectAvatar} />
        ))}
      </div>
    </motion.div>
  );
}

// History Tab
function HistoryTab({ insights }: { insights: any[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Chat History</h1>
        <p className="text-muted-foreground">Review your past conversations</p>
      </div>
      {insights.length === 0 ? (
        <div className="glass border-gradient rounded-xl p-8 text-center">
          <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
          <p className="text-muted-foreground text-sm">Your conversations will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => {
            const avatar = avatars.find(a => a.id === insight.avatar_id);
            return (
              <div key={insight.id} className="glass border-gradient rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <img src={avatar?.imageUrl} alt={avatar?.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-medium">{avatar?.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(insight.created_at).toLocaleDateString()}</p>
                  </div>
                  {insight.mood && <Badge variant="secondary">{insight.mood}</Badge>}
                </div>
                {insight.summary && <p className="text-sm text-muted-foreground">{insight.summary}</p>}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// Tokens Tab
function TokensTab({ tokenBalance, referralCode, referrals, onGenerateCode, totalBonusTokens }: { 
  tokenBalance: number; 
  referralCode: string | null;
  referrals: any[];
  onGenerateCode: () => Promise<string | null>;
  totalBonusTokens: number;
}) {
  const [copied, setCopied] = useState(false);
  
  const handleCopyCode = async () => {
    if (!referralCode) {
      await onGenerateCode();
    }
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">My Tokens</h1>
        <p className="text-muted-foreground">Purchase tokens for voice and video calls</p>
      </div>

      <div className="glass border-gradient rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Current balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gradient">{tokenBalance}</span>
              <span className="text-muted-foreground">tokens</span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-accent flex items-center justify-center">
            <Zap className="w-8 h-8 text-background" />
          </div>
        </div>
      </div>

      {/* Referral Section */}
      <div className="glass border-gradient rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5 text-gold" /> Invite Friends
        </h3>
        <p className="text-sm text-muted-foreground mb-4">Earn 50 tokens for every friend who signs up!</p>
        <div className="flex gap-2">
          <Input value={referralCode || "Generate your code"} readOnly className="bg-secondary/50" />
          <Button onClick={handleCopyCode} className="gradient-primary">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        {referrals.length > 0 && (
          <p className="text-sm text-muted-foreground mt-3">
            {referrals.length} friends invited • {totalBonusTokens} tokens earned
          </p>
        )}
      </div>
    </motion.div>
  );
}

// Settings Tab  
function SettingsTab({ user, profile, onUpgrade }: { user: User | null; profile: any; onUpgrade: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        <div className="glass border-gradient rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Profile</h3>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/30">
              <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{profile?.display_name || user?.user_metadata?.full_name || "User"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {profile?.bio && <p className="text-xs text-muted-foreground mt-1">{profile.bio}</p>}
            </div>
          </div>
        </div>

        <div className="glass border-gradient rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> Subscription
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-primary/20 text-primary">
                <Sparkles className="w-3 h-3 mr-1" /> {profile?.subscription_tier || "Free"}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">{profile?.tokens_balance || 0} tokens available</p>
            </div>
            <Button className="gradient-primary" onClick={onUpgrade}>Upgrade</Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
