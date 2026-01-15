import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2, Sparkles, Check } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import kindredIcon from "@/assets/kindred-icon.png";

export default function SignUp() {
  const [searchParams] = useSearchParams();
  const selectedAvatar = searchParams.get("avatar");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: formData.name,
            selected_avatar: selectedAvatar,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Account creato!",
        description: "Benvenuto su Kindred. Trova il tuo compagno perfetto.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registrazione fallita",
        description: error.message || "Qualcosa è andato storto. Riprova.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    "Chat illimitate con AI empatica",
    "Chiamate vocali realistiche",
    "Videochiamate animate",
    "Memoria delle conversazioni",
    "Disponibilità 24/7",
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-8">
            <img src={kindredIcon} alt="Kindred" className="w-10 h-10" />
            <span className="text-xl font-display font-bold text-gradient">
              Kindred
            </span>
          </Link>

          <h1 className="text-3xl font-display font-bold mb-2">
            Crea il tuo account
          </h1>
          <p className="text-muted-foreground mb-8">
            Inizia il tuo viaggio con compagni AI che ti capiscono
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Il tuo nome"
                  className="pl-10 bg-card border-border h-12"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="La tua email"
                  className="pl-10 bg-card border-border h-12"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Crea una password"
                  className="pl-10 bg-card border-border h-12"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>
              <p className="text-xs text-muted-foreground">Minimo 6 caratteri</p>
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary glow-primary h-12 text-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Inizia Gratis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Hai già un account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Accedi
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Registrandoti accetti i nostri{" "}
            <a href="#" className="text-primary hover:underline">Termini di Servizio</a>
            {" "}e la{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </motion.div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 gradient-cosmic" />
        
        {/* Animated orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-accent/15 rounded-full blur-[150px]"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-primary/15 rounded-full blur-[150px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        
        <div className="relative z-10 text-center px-12 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.img 
              src={kindredIcon} 
              alt="Kindred" 
              className="w-20 h-20 mx-auto mb-6"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <h2 className="text-4xl font-display font-bold mb-4">
              Trova il Tuo
              <br />
              <span className="text-gradient">Compagno Perfetto</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Unisciti a migliaia di utenti che hanno trovato connessioni significative con i loro compagni AI Kindred.
            </p>
            
            {/* Features list */}
            <div className="text-left space-y-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground/80">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
