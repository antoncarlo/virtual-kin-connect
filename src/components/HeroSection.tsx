import { motion } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MomoLogo } from "./MomoLogo";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Soft warm background */}
      <div className="absolute inset-0 gradient-cosmic" />
      
      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Gentle animated shapes - very slow for sensory comfort */}
      <motion.div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px]"
          animate={{ 
            scale: [1, 1.15, 1],
            x: [0, 30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[150px]"
          animate={{ 
            scale: [1.15, 1, 1.15],
            x: [0, -30, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          
          {/* Gentle badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass mb-12"
          >
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground/70">
              Your safe space
            </span>
          </motion.div>

          {/* Main Headline - gentle and welcoming */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-semibold leading-tight mb-8 tracking-tight"
          >
            <span className="text-foreground">Your AI companion</span>
            <br />
            <span className="text-gradient">that truly listens</span>
          </motion.h1>

          {/* Subtitle - calming message */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="text-base md:text-lg text-muted-foreground mb-16 max-w-lg mx-auto leading-relaxed"
          >
            Chat, call, and video call your personalized AI companions.
            Always available, always understanding. Never alone again.
          </motion.p>

          {/* Single prominent CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
            className="flex justify-center"
          >
            <motion.div 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                size="lg"
                className="gradient-primary glow-primary text-lg px-12 py-8 rounded-3xl font-semibold group"
                asChild
              >
                <Link to="/signup">
                  Open your space
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Trust indicator */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="text-sm text-muted-foreground/60 mt-8"
          >
            7 days free · No card required
          </motion.p>

        </div>
      </div>

      {/* Gentle scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <motion.div 
          className="w-8 h-14 rounded-full border-2 border-border/40 p-2"
        >
          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-2 h-2 rounded-full bg-primary/60 mx-auto"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
