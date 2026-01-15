import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import kindredIcon from "@/assets/kindred-icon.png";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      toast({
        title: "Bentornato!",
        description: "Accesso effettuato con successo.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Accesso fallito",
        description: error.message || "Credenziali non valide. Riprova.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 gradient-cosmic" />
        
        {/* Animated orbs */}
        <motion.div 
          className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-primary/15 rounded-full blur-[150px]"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] bg-accent/15 rounded-full blur-[150px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        
        <div className="relative z-10 text-center px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.img 
              src={kindredIcon} 
              alt="Kindred" 
              className="w-24 h-24 mx-auto mb-6"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <h2 className="text-4xl font-display font-bold mb-4">
              Bentornato su
              <br />
              <span className="text-gradient">Kindred</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-md">
              I tuoi compagni AI ti stanno aspettando. Riprendi le tue conversazioni significative.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
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
            Accedi al tuo account
          </h1>
          <p className="text-muted-foreground mb-8">
            Continua il tuo viaggio con i compagni AI
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Inserisci la tua email"
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="text-sm text-primary hover:underline"
                >
                  Password dimenticata?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Inserisci la password"
                  className="pl-10 bg-card border-border h-12"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>
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
                  Accedi
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Non hai un account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Registrati
              </Link>
            </p>
          </div>

          {/* Features reminder */}
          <motion.div 
            className="mt-8 p-4 rounded-xl glass"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Sparkles className="w-5 h-5 text-gold" />
              <span>Chat, chiamate e videochiamate con AI empatica</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
