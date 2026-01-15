import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useRef } from "react";
import introVideo from "@/assets/kindred-intro.mp4";

export function HeroSection() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects - Light & Fresh */}
      <div className="absolute inset-0 gradient-cosmic" />
      
      {/* Animated mesh gradient with parallax */}
      <motion.div className="absolute inset-0 overflow-hidden" style={{ y: backgroundY }}>
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[200px]"
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[200px]"
          animate={{ 
            scale: [1.3, 1, 1.3],
            x: [0, -50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/15 rounded-full blur-[250px]"
          animate={{ 
            scale: [1, 1.15, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-primary/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              delay: Math.random() * 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Subtle noise texture */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <motion.div 
        className="container mx-auto px-4 relative z-10"
        style={{ y: textY, opacity, scale }}
      >
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass mb-10"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-gold" />
            </motion.div>
            <span className="text-sm font-medium text-foreground/80">
              Next-Gen AI Companions
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-8xl font-display font-bold leading-[1.1] mb-8 tracking-tight"
          >
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Connect with
            </motion.span>
            <br />
            <motion.span 
              className="text-gradient inline-block"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              Someone Who Cares
            </motion.span>
          </motion.h1>

          {/* Subtitle - smaller and impactful */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-lg text-muted-foreground mb-12 max-w-xl mx-auto"
          >
            Mai più soli. Il tuo compagno AI che ascolta, capisce e c'è sempre.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                className="gradient-primary glow-primary text-lg px-10 py-7 rounded-2xl font-semibold group shimmer"
                asChild
              >
                <Link to="/signup">
                  Start Your Journey
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-10 py-7 rounded-2xl border-border/50 hover:bg-secondary/50 font-medium group"
                onClick={handlePlayVideo}
              >
                <Play className="mr-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>

          {/* Video Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative max-w-4xl mx-auto"
          >
            {/* Outer glow */}
            <motion.div 
              className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-[2rem] blur-2xl"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.02, 1],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <div className="relative rounded-3xl overflow-hidden border border-border/30 shadow-2xl shadow-primary/10">
              <div className="relative bg-card rounded-3xl overflow-hidden">
                <video
                  ref={videoRef}
                  src={introVideo}
                  className="w-full aspect-video object-cover"
                  loop
                  muted={isMuted}
                  playsInline
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                />
                
                {/* Play overlay */}
                {!isVideoPlaying && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer"
                    onClick={handlePlayVideo}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30"
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{ 
                        boxShadow: ["0 0 0 0 rgba(255,255,255,0.4)", "0 0 0 20px rgba(255,255,255,0)", "0 0 0 0 rgba(255,255,255,0.4)"],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Play className="w-10 h-10 text-white fill-white ml-1" />
                    </motion.div>
                  </motion.div>
                )}
                
                {/* Video controls */}
                {isVideoPlaying && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute bottom-4 right-4 flex gap-2"
                  >
                    <motion.button
                      className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white"
                      onClick={toggleMute}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </div>
            
            {/* Video label */}
            <motion.div
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full glass text-sm font-medium text-foreground/80"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              🎬 Guarda come funziona Kindred
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-24 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            {[
              { value: "100K+", label: "Happy Users" },
              { value: "24/7", label: "Always Available" },
              { value: "4.9★", label: "User Rating" },
            ].map((stat, index) => (
              <motion.div 
                key={stat.label} 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div 
                  className="text-3xl md:text-4xl font-display font-bold text-gradient mb-1"
                  animate={{ 
                    textShadow: ["0 0 20px hsl(var(--primary) / 0)", "0 0 20px hsl(var(--primary) / 0.3)", "0 0 20px hsl(var(--primary) / 0)"],
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div 
          className="w-6 h-11 rounded-full border-2 border-muted-foreground/30 p-1"
          whileHover={{ borderColor: "hsl(var(--primary) / 0.5)" }}
        >
          <motion.div
            animate={{ y: [0, 18, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full bg-primary mx-auto"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
