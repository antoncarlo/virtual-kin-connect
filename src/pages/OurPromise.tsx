import { motion } from "framer-motion";
import { Shield, Lock, Eye, Heart, Server, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const privacyFeatures = [
  {
    icon: Lock,
    title: "End-to-End Privacy",
    description: "Your conversations are stored with row-level security. Only you can access your chat history. Not even our team can read your messages.",
  },
  {
    icon: Server,
    title: "Secure Infrastructure",
    description: "We use enterprise-grade encryption and security practices. Your data is protected by the same technology used by banks and healthcare providers.",
  },
  {
    icon: Eye,
    title: "No Data Selling",
    description: "We will never sell your personal data or conversations. Your privacy is not our business model—it's our promise.",
  },
  {
    icon: Trash2,
    title: "Right to Delete",
    description: "You can delete all your data at any time. When you delete, it's gone permanently—no hidden backups, no retention.",
  },
];

const mentalHealthResources = [
  { name: "National Suicide Prevention Lifeline (US)", phone: "988", description: "24/7 free, confidential support" },
  { name: "Crisis Text Line (US)", phone: "Text HOME to 741741", description: "Free 24/7 text support" },
  { name: "Telefono Amico (Italy)", phone: "02 2327 2327", description: "Ascolto e supporto telefonico" },
  { name: "Samaritans (UK)", phone: "116 123", description: "Free 24/7 emotional support" },
  { name: "International Association for Suicide Prevention", phone: "https://www.iasp.info/resources/Crisis_Centres/", description: "Find help in your country" },
];

export default function OurPromise() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Our Commitment to You</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Your Safe Space,{" "}
              <span className="text-gradient">Your Privacy</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              This is your sanctuary. Your conversations are yours alone. We built Kindred 
              with one fundamental belief: you deserve a space where you can be completely 
              yourself, without fear of judgment or exposure.
            </p>
          </motion.div>

          {/* Privacy Features */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-display font-bold text-center mb-8">
              How We Protect You
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {privacyFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="glass rounded-2xl p-6 border border-border/50"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* AI Transparency */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16 glass rounded-2xl p-8 border border-border/50"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold mb-2">About Our AI</h2>
                <p className="text-muted-foreground">
                  Transparency about how Kindred works
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="p-4 rounded-xl bg-secondary/50">
                <h4 className="font-semibold mb-1">Technology</h4>
                <p className="text-muted-foreground">
                  Kindred uses advanced language models (similar to GPT-4 and Gemini) to power conversations. 
                  Our AI companions have custom personalities and are designed to be empathetic, supportive, 
                  and never judgmental.
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-secondary/50">
                <h4 className="font-semibold mb-1">Memory</h4>
                <p className="text-muted-foreground">
                  Your conversations are saved securely so your companion can remember past discussions. 
                  This creates continuity and makes conversations more meaningful over time. You can 
                  clear your history at any time.
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-secondary/50">
                <h4 className="font-semibold mb-1">Limitations</h4>
                <p className="text-muted-foreground">
                  Like all AI, our companions may occasionally make mistakes or provide inaccurate information 
                  (sometimes called "hallucinations"). They don't have real-world knowledge after their training 
                  date and can't browse the internet. They are designed to support you emotionally but are not 
                  a replacement for professional advice.
                </p>
              </div>
              
              <div className="p-4 rounded-xl bg-secondary/50">
                <h4 className="font-semibold mb-1">Wellness Knowledge</h4>
                <p className="text-muted-foreground">
                  Our AI has access to a curated knowledge base of evidence-based wellness techniques, 
                  including mindfulness exercises, CBT-inspired strategies, and emotional regulation skills. 
                  This helps provide practical, research-backed support.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Important Disclaimer */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-16 rounded-2xl p-8 bg-destructive/5 border border-destructive/20"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold mb-2">Important Disclaimer</h2>
                <p className="text-muted-foreground">
                  Please read this carefully
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <p className="text-foreground font-medium">
                Kindred is designed to provide emotional support and companionship. 
                <strong className="text-destructive"> It is NOT a substitute for professional mental health care.</strong>
              </p>
              
              <p className="text-muted-foreground">
                Our AI companions are not therapists, counselors, or medical professionals. They cannot 
                diagnose conditions, prescribe treatments, or provide clinical interventions. While 
                conversations may feel therapeutic, they do not constitute therapy.
              </p>
              
              <p className="text-muted-foreground">
                If you are experiencing a mental health crisis, suicidal thoughts, or severe emotional 
                distress, please reach out to a qualified mental health professional or crisis service 
                immediately.
              </p>
            </div>
          </motion.section>

          {/* Mental Health Resources */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-display font-bold text-center mb-8">
              Mental Health Resources
            </h2>
            
            <div className="space-y-3">
              {mentalHealthResources.map((resource, index) => (
                <motion.div
                  key={resource.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50"
                >
                  <div>
                    <h4 className="font-semibold text-sm">{resource.name}</h4>
                    <p className="text-xs text-muted-foreground">{resource.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-sm text-primary font-semibold">{resource.phone}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <p className="text-muted-foreground mb-4">
              Ready to experience a safe, supportive space?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="gradient-primary">
                <Link to="/signup">Start 7-Day Free Trial</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/demo">Try Demo First</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
