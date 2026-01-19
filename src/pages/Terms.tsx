import { motion } from "framer-motion";
import { FileText, Scale, Users, CreditCard, Ban, AlertTriangle, RefreshCw, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Terms() {
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
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Terms of Service</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Terms of{" "}
              <span className="text-gradient">Service</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Please read these terms carefully before using MOMO. By using our service, 
              you agree to be bound by these terms and conditions.
            </p>
            
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: January 19, 2025
            </p>
          </motion.div>

          {/* Sections */}
          <div className="space-y-8">
            {/* Acceptance of Terms */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-8 border border-border/50"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Scale className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">1. Acceptance of Terms</h2>
                  <p className="text-muted-foreground">Agreement to our terms</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  By accessing or using MOMO ("the Service"), you agree to be bound by these 
                  Terms of Service ("Terms"). If you disagree with any part of these terms, 
                  you may not access the Service.
                </p>
                <p>
                  MOMO is operated by MOMO AI ("we", "us", "our"). We reserve the right to 
                  update these Terms at any time. We will notify you of any significant changes 
                  via email or through the Service.
                </p>
                <p>
                  You must be at least 18 years old to use this Service. By using MOMO, you 
                  represent and warrant that you meet this age requirement.
                </p>
              </div>
            </motion.section>

            {/* Description of Service */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass rounded-2xl p-8 border border-border/50"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">2. Description of Service</h2>
                  <p className="text-muted-foreground">What MOMO provides</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  MOMO is an AI companion service that provides conversational experiences 
                  through text, voice, and video interactions. Our AI companions are designed 
                  to offer emotional support, companionship, and engaging conversations.
                </p>
                <p className="font-medium text-foreground">
                  Important: MOMO is NOT a substitute for professional mental health care, 
                  therapy, or medical advice.
                </p>
                <p>
                  Our AI companions:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• Are powered by advanced language models</li>
                  <li>• Remember past conversations to provide personalized experiences</li>
                  <li>• May occasionally make errors or provide inaccurate information</li>
                  <li>• Cannot provide professional medical, legal, or financial advice</li>
                  <li>• Are not real humans and cannot form genuine relationships</li>
                </ul>
              </div>
            </motion.section>

            {/* User Accounts */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-8 border border-border/50"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">3. User Accounts</h2>
                  <p className="text-muted-foreground">Account responsibilities</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  When you create an account, you must:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• Provide accurate and complete information</li>
                  <li>• Maintain the security of your account credentials</li>
                  <li>• Promptly notify us of any unauthorized access</li>
                  <li>• Accept responsibility for all activities under your account</li>
                </ul>
                <p>
                  You may not share your account with others or create multiple accounts. 
                  We reserve the right to suspend or terminate accounts that violate these terms.
                </p>
              </div>
            </motion.section>

            {/* Payment Terms */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass rounded-2xl p-8 border border-border/50"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">4. Payment Terms</h2>
                  <p className="text-muted-foreground">Subscriptions and billing</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h4 className="font-semibold mb-2">Free Trial</h4>
                  <p>
                    New users may receive a free trial period. After the trial ends, you will 
                    be required to subscribe to continue using the Service.
                  </p>
                </div>
                
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h4 className="font-semibold mb-2">Subscriptions</h4>
                  <p>
                    Subscriptions are billed on a recurring basis (monthly or annually). By 
                    subscribing, you authorize us to charge your payment method automatically.
                  </p>
                </div>
                
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h4 className="font-semibold mb-2">Token System</h4>
                  <p>
                    Some features use a token-based system. Tokens are non-refundable and expire 
                    according to the terms of your subscription plan. Unused tokens do not roll 
                    over unless specified.
                  </p>
                </div>
                
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h4 className="font-semibold mb-2">Refunds</h4>
                  <p>
                    Subscription fees are generally non-refundable. However, we may consider 
                    refund requests on a case-by-case basis for unused subscription periods.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Prohibited Uses */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-8 border border-border/50"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <Ban className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">5. Prohibited Uses</h2>
                  <p className="text-muted-foreground">What you may not do</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  You agree NOT to use MOMO to:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• Engage in illegal activities or promote violence</li>
                  <li>• Harass, abuse, or harm others</li>
                  <li>• Generate content that exploits or endangers minors</li>
                  <li>• Attempt to manipulate or "jailbreak" the AI</li>
                  <li>• Scrape, copy, or reverse engineer the Service</li>
                  <li>• Impersonate others or spread misinformation</li>
                  <li>• Use automated systems to access the Service</li>
                  <li>• Circumvent security measures or access restrictions</li>
                  <li>• Share your account access with third parties</li>
                </ul>
                <p>
                  Violation of these terms may result in immediate account termination 
                  without refund.
                </p>
              </div>
            </motion.section>

            {/* Disclaimers */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl p-8 bg-destructive/5 border border-destructive/20"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">6. Disclaimers</h2>
                  <p className="text-muted-foreground">Limitations of our service</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <p className="font-medium text-foreground">
                  THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.
                </p>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    <strong>No Professional Advice:</strong> MOMO does not provide and is not 
                    a substitute for professional medical, mental health, legal, financial, or 
                    other professional advice. Always consult qualified professionals for such matters.
                  </p>
                  <p>
                    <strong>AI Limitations:</strong> Our AI may produce inaccurate, inappropriate, 
                    or nonsensical responses. Do not rely on AI responses for important decisions.
                  </p>
                  <p>
                    <strong>Availability:</strong> We do not guarantee uninterrupted access to 
                    the Service. We may modify, suspend, or discontinue features without notice.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Limitation of Liability */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-8 border border-border/50"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Gavel className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">7. Limitation of Liability</h2>
                  <p className="text-muted-foreground">Our liability limits</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• We are not liable for any indirect, incidental, special, consequential, 
                    or punitive damages</li>
                  <li>• Our total liability shall not exceed the amount you paid us in the 
                    12 months preceding the claim</li>
                  <li>• We are not responsible for any actions taken based on AI responses</li>
                  <li>• We are not liable for content generated by the AI that may be 
                    inaccurate or offensive</li>
                </ul>
              </div>
            </motion.section>

            {/* Changes to Terms */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="glass rounded-2xl p-8 border border-border/50"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">8. Changes to Terms</h2>
                  <p className="text-muted-foreground">How we update these terms</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  We reserve the right to modify these Terms at any time. When we make changes:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• We will post the updated Terms on this page</li>
                  <li>• We will update the "Last updated" date</li>
                  <li>• For significant changes, we will notify you via email or in-app notification</li>
                  <li>• Continued use of the Service after changes constitutes acceptance</li>
                </ul>
              </div>
            </motion.section>

            {/* Contact */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass rounded-2xl p-8 border border-border/50"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">9. Contact</h2>
                  <p className="text-muted-foreground">Questions about these terms?</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-sm text-foreground font-medium">
                legal@momo.ai
              </p>
            </motion.section>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-center mt-12"
          >
            <Button asChild variant="outline" className="mr-4">
              <Link to="/">Back to Home</Link>
            </Button>
            <Button asChild className="gradient-primary">
              <Link to="/privacy">Read Privacy Policy</Link>
            </Button>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}