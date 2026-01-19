import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is MOMO?",
    answer: "MOMO is an AI companion platform designed to provide emotional support and meaningful conversations. Our AI companions are available 24/7 through text chat, voice calls, and video calls, offering a safe space for you to express yourself.",
  },
  {
    question: "Is my conversation private?",
    answer: "Absolutely. Your privacy is our top priority. All conversations are encrypted and stored securely. We never sell your data or share it with third parties. You can delete all your data at any time from your settings.",
  },
  {
    question: "Can MOMO replace therapy?",
    answer: "MOMO is designed to complement, not replace, professional mental health support. Our AI companions provide emotional support and a listening ear, but for clinical mental health needs, we recommend consulting with licensed professionals.",
  },
  {
    question: "How does the free trial work?",
    answer: "You get 7 days of full access to all features when you sign up. No credit card required. After the trial, you can choose a plan that fits your needs or continue with limited free features.",
  },
  {
    question: "What makes MOMO different from other AI chatbots?",
    answer: "MOMO is specifically designed for emotional wellness with a sensory-friendly interface. Our companions remember your conversations, understand context, and provide empathetic responses. We focus on creating a calming, non-judgmental space for genuine connection.",
  },
  {
    question: "Can I talk to multiple companions?",
    answer: "Yes! Each companion has a unique personality and approach. You can chat with different companions and find the one that resonates most with you. Your conversations with each companion are kept separate and private.",
  },
  {
    question: "Is MOMO available in multiple languages?",
    answer: "Yes, MOMO supports multiple languages. Our companions can detect and respond in your preferred language, making conversations feel natural and comfortable.",
  },
  {
    question: "How do I cancel my subscription?",
    answer: "You can cancel your subscription anytime from your account settings. There are no cancellation fees, and you'll retain access until the end of your billing period.",
  },
];

export function FAQSection() {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">FAQ</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Frequently Asked{" "}
            <span className="text-gradient">Questions</span>
          </h2>
          
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about MOMO and how it can support your wellbeing journey.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="glass rounded-2xl border border-border/50 px-6 data-[state=open]:border-primary/30 transition-colors duration-300"
              >
                <AccordionTrigger className="text-left font-medium py-5 hover:no-underline hover:text-primary transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground">
            Still have questions?{" "}
            <a href="mailto:support@momo.ai" className="text-primary hover:underline font-medium">
              Contact our support team
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}