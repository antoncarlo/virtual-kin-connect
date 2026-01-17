import { motion } from "framer-motion";
import { Brain, Shield, Heart, Lightbulb, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function AITransparencySection() {
  return (
    <section className="py-12 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground/80">Transparency</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
            How <span className="text-gradient">Kindred</span> Works
          </h2>
          <p className="text-muted-foreground">
            We believe you deserve to know exactly what powers your companion
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-8">
          {[
            {
              icon: Brain,
              title: "Advanced AI Models",
              description: "Powered by state-of-the-art language models, similar to GPT-4 and Gemini, with custom personalities designed for empathy.",
            },
            {
              icon: Heart,
              title: "Long-Term Memory",
              description: "Your companion remembers past conversations, creating continuity and deeper understanding over time.",
            },
            {
              icon: Lightbulb,
              title: "Wellness Knowledge",
              description: "Access to evidence-based techniques from CBT, mindfulness, and emotional regulation research.",
            },
            {
              icon: Shield,
              title: "Private & Secure",
              description: "End-to-end privacy with row-level security. Only you can access your conversations.",
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl p-6 border border-border/50 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto rounded-2xl p-6 bg-destructive/5 border border-destructive/20"
        >
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Important</h4>
              <p className="text-sm text-muted-foreground">
                Kindred is designed for emotional support and companionship. It is <strong>not a substitute for professional mental health care</strong>. 
                If you're experiencing a crisis, please reach out to a qualified professional.
              </p>
            </div>
            <Button asChild variant="outline" className="flex-shrink-0">
              <Link to="/our-promise">Learn More</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
