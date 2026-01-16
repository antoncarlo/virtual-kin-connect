import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, MessageCircle, Sparkles, Send, Bot, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import kindredIcon from "@/assets/kindred-icon.png";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const DEMO_RESPONSES = [
  "Hi there! 👋 I'm Luna, your creative companion. It's wonderful to meet you! What's on your mind today?",
  "I hear you, and that's completely valid. It's okay to feel that way. Would you like to tell me more about what's been going on?",
  "That sounds like a lot to carry. Remember, you don't have to figure everything out right now. I'm here with you, and we can take this one step at a time.",
  "I appreciate you sharing that with me. It takes courage to open up. What would feel most helpful right now - talking it through, or perhaps a simple breathing exercise together?",
  "You're doing great just by being here and expressing yourself. That's a real strength. Is there anything specific you'd like to explore together?",
];

export default function Demo() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! 👋 I'm Luna, one of the Kindred companions. This is a quick demo so you can experience what it's like to chat with us. Go ahead, say hello!",
    },
  ]);
  const [input, setInput] = useState("");
  const [messageCount, setMessageCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const MAX_DEMO_MESSAGES = 5;

  const handleSend = async () => {
    if (!input.trim() || messageCount >= MAX_DEMO_MESSAGES || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI thinking
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

    const responseIndex = Math.min(messageCount, DEMO_RESPONSES.length - 1);
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: DEMO_RESPONSES[responseIndex],
    };

    setMessages((prev) => [...prev, aiMessage]);
    setMessageCount((prev) => prev + 1);
    setIsTyping(false);
  };

  const remainingMessages = MAX_DEMO_MESSAGES - messageCount;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium">Interactive Demo</span>
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">
              Try Kindred <span className="text-gradient">Now</span>
            </h1>
            <p className="text-muted-foreground">
              Experience a conversation with Luna. No signup required.
            </p>
          </motion.div>

          {/* Demo Chat */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl overflow-hidden border border-border/50"
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-border/50 flex items-center gap-3">
              <img 
                src={kindredIcon} 
                alt="Luna" 
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold">Luna</h3>
                <p className="text-xs text-muted-foreground">Creative Soul • Demo Mode</p>
              </div>
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <MessageCircle className="w-3.5 h-3.5" />
                {remainingMessages} messages left
              </div>
            </div>

            {/* Messages */}
            <div className="h-[400px] overflow-y-auto p-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user" 
                        ? "bg-primary/10 text-primary" 
                        : "bg-accent/10 text-accent"
                    }`}>
                      {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                    }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-secondary rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/50">
              {remainingMessages > 0 ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    You've used all demo messages. Ready for the full experience?
                  </p>
                  <Button asChild className="gradient-primary">
                    <Link to="/signup">
                      Start 7-Day Free Trial
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
              <Shield className="w-4 h-4" />
              <span>Your conversations are private and encrypted</span>
            </div>
            <p className="text-muted-foreground mb-4">
              Want unlimited conversations, voice calls, and video?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="gradient-primary">
                <Link to="/signup">
                  Start 7-Day Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/our-promise">
                  Learn About Privacy
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
