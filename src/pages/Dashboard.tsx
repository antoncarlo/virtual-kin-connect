import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, MessageCircle, Phone, Settings, LogOut, Loader2, 
  Zap, Crown, ChevronRight, History, CreditCard, Bell,
  Home, Menu, X, Sparkles, Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AvatarCard } from "@/components/AvatarCard";
import { avatars, type Avatar as AvatarType } from "@/data/avatars";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

  // Mock data - in production would come from database
  const [tokenBalance] = useState(150);
  const [plan] = useState("Starter");

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Disconnesso",
      description: "A presto!",
    });
  };

  const handleSelectAvatar = (avatar: AvatarType) => {
    navigate(`/chat/${avatar.id}`);
  };

  const navItems = [
    { id: "home" as TabType, label: "Home", icon: Home },
    { id: "avatars" as TabType, label: "I Miei Avatar", icon: Users },
    { id: "history" as TabType, label: "Cronologia", icon: History },
    { id: "tokens" as TabType, label: "Token", icon: Zap },
    { id: "settings" as TabType, label: "Impostazioni", icon: Settings },
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
                  <span className="text-sm text-muted-foreground">Token disponibili</span>
                  <Zap className="w-4 h-4 text-gold" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{tokenBalance}</span>
                  <span className="text-xs text-muted-foreground">token</span>
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
                Esci
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
                tokenBalance={tokenBalance}
                onSelectAvatar={handleSelectAvatar}
              />
            )}
            {activeTab === "avatars" && (
              <AvatarsTab 
                key="avatars"
                onSelectAvatar={handleSelectAvatar}
              />
            )}
            {activeTab === "history" && (
              <HistoryTab key="history" />
            )}
            {activeTab === "tokens" && (
              <TokensTab key="tokens" tokenBalance={tokenBalance} />
            )}
            {activeTab === "settings" && (
              <SettingsTab key="settings" user={user} />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// Home Tab Component
function HomeTab({ 
  user, 
  messageCount, 
  tokenBalance,
  onSelectAvatar 
}: { 
  user: User | null;
  messageCount: number;
  tokenBalance: number;
  onSelectAvatar: (avatar: AvatarType) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
          Bentornato, <span className="text-gradient">{user?.user_metadata?.full_name || "Amico"}</span>
        </h1>
        <p className="text-muted-foreground">
          I tuoi compagni AI ti stanno aspettando
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: MessageCircle, label: "Messaggi", value: messageCount.toString(), color: "text-primary" },
          { icon: Phone, label: "Chiamate", value: "0", color: "text-accent" },
          { icon: Video, label: "Video", value: "0", color: "text-pink-500" },
          { icon: Zap, label: "Token", value: tokenBalance.toString(), color: "text-gold" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            whileHover={{ y: -4 }}
            className="glass border-gradient p-4 rounded-xl"
          >
            <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Featured Avatars */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-semibold">I tuoi Kindred</h2>
          <Button variant="ghost" size="sm" className="text-primary">
            Vedi tutti <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {avatars.slice(0, 3).map((avatar, index) => (
            <AvatarCard
              key={avatar.id}
              avatar={avatar}
              index={index}
              onSelect={onSelectAvatar}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Avatars Tab
function AvatarsTab({ onSelectAvatar }: { onSelectAvatar: (avatar: AvatarType) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">I Miei Avatar</h1>
        <p className="text-muted-foreground">
          Scegli un compagno per iniziare una conversazione
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {avatars.map((avatar, index) => (
          <AvatarCard
            key={avatar.id}
            avatar={avatar}
            index={index}
            onSelect={onSelectAvatar}
          />
        ))}
      </div>
    </motion.div>
  );
}

// History Tab
function HistoryTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Cronologia Chat</h1>
        <p className="text-muted-foreground">
          Rivedi le tue conversazioni passate
        </p>
      </div>

      <div className="glass border-gradient rounded-xl p-8 text-center">
        <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nessuna conversazione</h3>
        <p className="text-muted-foreground text-sm">
          Le tue conversazioni appariranno qui
        </p>
      </div>
    </motion.div>
  );
}

// Tokens Tab
function TokensTab({ tokenBalance }: { tokenBalance: number }) {
  const tokenPackages = [
    { tokens: 100, price: 10, bonus: "", popular: false },
    { tokens: 250, price: 20, bonus: "+25 bonus", popular: false },
    { tokens: 500, price: 35, bonus: "+75 bonus", popular: true },
    { tokens: 1000, price: 60, bonus: "+200 bonus", popular: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">I Miei Token</h1>
        <p className="text-muted-foreground">
          Acquista token per chiamate vocali e videochiamate
        </p>
      </div>

      {/* Current Balance */}
      <div className="glass border-gradient rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Saldo attuale</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gradient">{tokenBalance}</span>
              <span className="text-muted-foreground">token</span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-accent flex items-center justify-center">
            <Zap className="w-8 h-8 text-background" />
          </div>
        </div>
        <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Phone className="w-4 h-4" /> ~25 min chiamate
          </span>
          <span className="flex items-center gap-1">
            <Video className="w-4 h-4" /> ~15 min video
          </span>
        </div>
      </div>

      {/* Token Packages */}
      <h2 className="text-xl font-display font-semibold mb-4">Acquista Token</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tokenPackages.map((pkg, index) => (
          <motion.div
            key={pkg.tokens}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`relative rounded-xl p-5 text-center cursor-pointer transition-all ${
              pkg.popular 
                ? "glass border-2 border-gold/30" 
                : "bg-card border border-border hover:border-primary/30"
            }`}
          >
            {pkg.popular && (
              <Badge className="absolute -top-2 -right-2 bg-gold text-background">
                BEST
              </Badge>
            )}
            <Zap className={`w-8 h-8 mx-auto mb-2 ${pkg.popular ? "text-gold" : "text-primary"}`} />
            <div className="text-2xl font-bold">{pkg.tokens}</div>
            <div className="text-xs text-muted-foreground mb-2">token</div>
            {pkg.bonus && (
              <Badge variant="secondary" className="mb-2 text-xs">
                🎁 {pkg.bonus}
              </Badge>
            )}
            <div className="text-xl font-semibold">${pkg.price}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Settings Tab
function SettingsTab({ user }: { user: User | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Impostazioni</h1>
        <p className="text-muted-foreground">
          Gestisci il tuo account e le preferenze
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="glass border-gradient rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Profilo</h3>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/30">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.user_metadata?.full_name || "Utente"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" className="ml-auto">
              Modifica
            </Button>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass border-gradient rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" /> Notifiche
          </h3>
          <div className="space-y-3">
            {[
              { label: "Notifiche email", desc: "Ricevi aggiornamenti via email" },
              { label: "Notifiche push", desc: "Notifiche in tempo reale" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Button variant="outline" size="sm">
                  Attiva
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription */}
        <div className="glass border-gradient rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> Abbonamento
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/20 text-primary">
                  <Sparkles className="w-3 h-3 mr-1" /> Starter
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">1 avatar • $49/mese</p>
            </div>
            <Button className="gradient-primary">
              Upgrade
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
