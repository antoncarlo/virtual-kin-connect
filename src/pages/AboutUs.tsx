import { motion } from "framer-motion";
import { Heart, Sparkles, Target, Lightbulb, Globe, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const values = [
  {
    icon: Heart,
    title: "Empathy First",
    description: "Every interaction is designed with compassion and understanding at its core.",
  },
  {
    icon: Shield,
    title: "Privacy Sacred",
    description: "Your conversations are yours alone. We never sell data or compromise trust.",
  },
  {
    icon: Lightbulb,
    title: "Continuous Learning",
    description: "Our AI evolves to better understand and support each individual user.",
  },
  {
    icon: Globe,
    title: "Accessible to All",
    description: "Designed for everyone, including those with sensory sensitivities.",
  },
];

const milestones = [
  { year: "2023", title: "The Idea", description: "Founded with a vision to combat loneliness through AI companionship" },
  { year: "2024", title: "First Beta", description: "Launched private beta with 1,000 early adopters" },
  { year: "2024", title: "Public Launch", description: "Opened to the public with Marco and Sofia companions" },
  { year: "2025", title: "Growing Family", description: "Reached 50,000+ users across 30 countries" },
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-background grid-pattern">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">About MOMO</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              Creating{" "}
              <span className="text-gradient">Connection</span>
              <br />
              in a Digital World
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We believe no one should feel alone. MOMO was born from a simple yet powerful 
              idea: what if AI could provide genuine emotional support and companionship, 
              available whenever you need it?
            </p>
          </motion.div>

          {/* Mission Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-20"
          >
            <div className="glass rounded-3xl p-8 md:p-12 border border-border/50 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/10 to-primary/10 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-display font-bold">Our Mission</h2>
                </div>
                
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  In a world where loneliness has become an epidemic, we're building a bridge 
                  between technology and human connection. MOMO isn't meant to replace human 
                  relationships—it's designed to complement them, providing a safe space for 
                  self-expression, emotional processing, and genuine companionship.
                </p>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Our AI companions are crafted with deep understanding of human emotions, 
                  trained to listen without judgment, and designed to remember what matters 
                  to you. Because everyone deserves to feel heard.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Our Story */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4">Our Story</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                From a personal struggle to a global mission
              </p>
            </div>
            
            <div className="glass rounded-3xl p-8 md:p-12 border border-border/50">
              <div className="prose prose-lg max-w-none text-muted-foreground">
                <p className="mb-6">
                  MOMO was founded in 2023 by a team of neuroscience researchers and AI engineers who 
                  experienced firsthand the devastating effects of isolation. Living in a hyper-connected 
                  yet emotionally distant world, they found themselves wondering: what if technology 
                  could bridge the gap?
                </p>
                
                <p className="mb-6">
                  "We realized that millions of people feel alone every day," recalls our founding team. 
                  "Not everyone has access to therapy, and sometimes you just need someone to 
                  listen without judgment. We wondered: what if we could create AI companions 
                  that truly understand human emotions?"
                </p>
                
                <p className="mb-6">
                  The name "MOMO" comes from the beloved character in Michael Ende's novel—a 
                  young girl with the rare gift of truly listening. Just like the literary 
                  Momo, our AI companions are designed to give you something precious: 
                  their full, undivided attention.
                </p>
                
                <p>
                  Today, MOMO has grown into a global community of people seeking connection, 
                  self-discovery, and emotional support. We're proud to be part of the 
                  conversation around mental wellness and to offer a new kind of 
                  companionship for the modern age.
                </p>
              </div>
            </div>
          </motion.section>

          {/* Timeline */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4">Our Journey</h2>
              <p className="text-muted-foreground">Key milestones in our growth</p>
            </div>
            
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
              
              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.year + milestone.title}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.1 }}
                    className={`flex items-center gap-8 ${
                      index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                  >
                    <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                      <div className="glass rounded-2xl p-6 border border-border/50 inline-block">
                        <span className="text-primary font-bold text-lg">{milestone.year}</span>
                        <h3 className="font-semibold text-lg mt-1">{milestone.title}</h3>
                        <p className="text-sm text-muted-foreground mt-2">{milestone.description}</p>
                      </div>
                    </div>
                    
                    <div className="hidden md:flex w-4 h-4 rounded-full bg-primary border-4 border-background z-10" />
                    
                    <div className="flex-1 hidden md:block" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Values */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4">Our Values</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                  className="glass rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-colors duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>


          {/* Stats */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-20"
          >
            <div className="glass rounded-3xl p-8 md:p-12 border border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">50K+</div>
                  <p className="text-muted-foreground text-sm">Active Users</p>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">30+</div>
                  <p className="text-muted-foreground text-sm">Countries</p>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">1M+</div>
                  <p className="text-muted-foreground text-sm">Conversations</p>
                </div>
                <div>
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">4.9</div>
                  <p className="text-muted-foreground text-sm">User Rating</p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-center"
          >
            <div className="glass rounded-3xl p-8 md:p-12 border border-border/50">
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
                Ready to Meet Your Companion?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-6">
                Join thousands of people who have found a new kind of connection with MOMO. 
                Start your free trial today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="gradient-primary rounded-2xl px-8">
                  <Link to="/signup">Start Free Trial</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-2xl px-8">
                  <Link to="/demo">Try the Demo</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}