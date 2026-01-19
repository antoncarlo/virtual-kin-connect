import { motion } from "framer-motion";
import { Shield, Eye, Database, Lock, Trash2, Globe, UserCheck, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background grid-pattern">
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
              <span className="text-sm font-medium">Privacy Policy</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Your Privacy{" "}
              <span className="text-gradient">Matters</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We are committed to protecting your personal information and being transparent 
              about how we collect, use, and safeguard your data.
            </p>
            
            <p className="text-sm text-muted-foreground mt-4">
              Last updated: January 19, 2025
            </p>
          </motion.div>

          {/* Sections */}
          <div className="space-y-8">
            {/* Information We Collect */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl p-8 border border-border/50"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">Information We Collect</h2>
                  <p className="text-muted-foreground">What data we gather and why</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h4 className="font-semibold mb-2">Account Information</h4>
                  <p className="text-muted-foreground">
                    When you create an account, we collect your email address and any profile 
                    information you choose to provide (display name, avatar). This information 
                    is used to identify your account and personalize your experience.
                  </p>
                </div>
                
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h4 className="font-semibold mb-2">Conversation Data</h4>
                  <p className="text-muted-foreground">
                    Your chat messages with AI companions are stored securely to provide 
                    continuity across sessions. Your companion remembers past conversations 
                    to offer more personalized support. This data is encrypted and only 
                    accessible by you.
                  </p>
                </div>
                
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h4 className="font-semibold mb-2">Usage Analytics</h4>
                  <p className="text-muted-foreground">
                    We collect anonymized usage statistics to improve our service, including 
                    session duration, feature usage, and general interaction patterns. This 
                    data cannot be used to identify individual users or access personal content.
                  </p>
                </div>
                
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h4 className="font-semibold mb-2">Technical Data</h4>
                  <p className="text-muted-foreground">
                    We automatically collect certain technical information such as device type, 
                    browser version, and IP address for security purposes and to ensure optimal 
                    service performance.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* How We Use Your Information */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="glass rounded-2xl p-8 border border-border/50"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">How We Use Your Information</h2>
                  <p className="text-muted-foreground">Our purposes for data processing</p>
                </div>
              </div>

              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>To provide and maintain our AI companion services</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>To personalize your experience and remember your preferences</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>To process payments and manage your subscription</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>To communicate important service updates and announcements</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>To improve our AI models and overall user experience</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>To detect and prevent fraud and abuse</span>
                </li>
              </ul>
            </motion.section>

            {/* Data Security */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-8 border border-border/50"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">Data Security</h2>
                  <p className="text-muted-foreground">How we protect your information</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  We implement industry-standard security measures to protect your data:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• End-to-end encryption for all data in transit (TLS 1.3)</li>
                  <li>• AES-256 encryption for data at rest</li>
                  <li>• Row-level security ensuring only you can access your conversations</li>
                  <li>• Regular security audits and penetration testing</li>
                  <li>• Secure, redundant data centers with 24/7 monitoring</li>
                  <li>• Multi-factor authentication options</li>
                </ul>
              </div>
            </motion.section>

            {/* Data Sharing */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass rounded-2xl p-8 border border-border/50"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">Data Sharing</h2>
                  <p className="text-muted-foreground">When and with whom we share data</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  We do NOT sell your personal data. Ever.
                </p>
                <p>
                  We may share limited information only in the following circumstances:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• <strong>Service Providers:</strong> We work with trusted partners 
                    (payment processors, cloud infrastructure) who help us deliver our 
                    services. They only access data necessary for their function and are 
                    bound by strict confidentiality agreements.</li>
                  <li>• <strong>Legal Requirements:</strong> We may disclose information 
                    if required by law, court order, or governmental regulation.</li>
                  <li>• <strong>Safety:</strong> In cases of imminent harm to yourself or 
                    others, we may share information with appropriate authorities.</li>
                </ul>
              </div>
            </motion.section>

            {/* Your Rights */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-2xl p-8 border border-border/50"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">Your Rights</h2>
                  <p className="text-muted-foreground">Control over your personal data</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h4 className="font-semibold mb-2">Access</h4>
                  <p className="text-muted-foreground">
                    You can access all your personal data through your account settings at any time.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h4 className="font-semibold mb-2">Correction</h4>
                  <p className="text-muted-foreground">
                    You can update or correct your personal information through your profile settings.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h4 className="font-semibold mb-2">Deletion</h4>
                  <p className="text-muted-foreground">
                    You can permanently delete all your data at any time from the account settings.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <h4 className="font-semibold mb-2">Portability</h4>
                  <p className="text-muted-foreground">
                    You can request a copy of your data in a standard, machine-readable format.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Data Retention */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="glass rounded-2xl p-8 border border-border/50"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">Data Retention</h2>
                  <p className="text-muted-foreground">How long we keep your data</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  We retain your data for as long as your account is active or as needed to 
                  provide you services. If you delete your account:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• Conversation data is permanently deleted within 30 days</li>
                  <li>• Account information is deleted immediately</li>
                  <li>• Anonymized analytics may be retained for service improvement</li>
                  <li>• We may retain certain records as required by law</li>
                </ul>
              </div>
            </motion.section>

            {/* Contact */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-8 border border-border/50"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">Contact Us</h2>
                  <p className="text-muted-foreground">Questions about privacy?</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                If you have any questions about this Privacy Policy or our data practices, 
                please contact us at:
              </p>
              <p className="text-sm text-foreground font-medium">
                privacy@momo.ai
              </p>
            </motion.section>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-center mt-12"
          >
            <Button asChild variant="outline" className="mr-4">
              <Link to="/">Back to Home</Link>
            </Button>
            <Button asChild className="gradient-primary">
              <Link to="/terms">Read Terms of Service</Link>
            </Button>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}