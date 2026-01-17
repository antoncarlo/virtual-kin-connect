import { motion } from "framer-motion";
import { AvatarCard } from "./AvatarCard";
import { avatars, type Avatar } from "@/data/avatars";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Sparkles } from "lucide-react";

export function AvatarGallery() {
  const navigate = useNavigate();

  const handleSelectAvatar = (avatar: Avatar) => {
    navigate(`/signup?avatar=${avatar.id}`);
  };

  return (
    <section id="avatars" className="py-12 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-8"
        >
          <span className="text-sm font-semibold tracking-widest uppercase text-primary mb-2 block">
            Meet Your
          </span>
          
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-2">
            AI <span className="text-gradient">Companions</span>
          </h2>
          
          <p className="text-muted-foreground">
            Two unique AI companions, each with their own personality.{" "}
            <span className="text-foreground font-medium">Choose who speaks to your heart.</span>
          </p>
        </motion.div>

        {/* Avatar Grid - Two cards centered */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-10">
          {avatars.map((avatar, index) => (
            <AvatarCard
              key={avatar.id}
              avatar={avatar}
              index={index}
              onSelect={handleSelectAvatar}
            />
          ))}
        </div>

        {/* Try Demo CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="max-w-xl mx-auto"
        >
          <div className="glass rounded-2xl p-6 border border-primary/20 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Try Before You Sign Up
            </div>
            <h3 className="text-xl font-display font-semibold mb-2">
              Experience a Demo Conversation
            </h3>
            <p className="text-muted-foreground text-sm mb-5">
              Not sure if Kindred is right for you? Try a quick demo conversation 
              with one of our AI companions—no account needed.
            </p>
            <Button asChild size="lg" className="gradient-primary gap-2">
              <Link to="/demo">
                <Play className="w-4 h-4" />
                Try Demo Now
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
