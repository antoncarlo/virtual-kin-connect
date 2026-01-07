import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "glass py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <Heart className="w-8 h-8 text-accent fill-accent/20 group-hover:fill-accent/40 transition-all" />
            <div className="absolute inset-0 blur-lg bg-accent/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="text-xl font-display font-bold text-gradient">
            SoulMate.ai
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#avatars"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Meet Your SoulMate
          </a>
          <a
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </a>
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
          <Button className="gradient-primary glow-primary" asChild>
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden glass mt-2 mx-4 rounded-xl p-4 space-y-4"
        >
          <a
            href="#avatars"
            className="block text-sm text-muted-foreground hover:text-foreground py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Meet Your SoulMate
          </a>
          <a
            href="#features"
            className="block text-sm text-muted-foreground hover:text-foreground py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Features
          </a>
          <a
            href="#pricing"
            className="block text-sm text-muted-foreground hover:text-foreground py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Pricing
          </a>
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <Button variant="ghost" className="w-full" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button className="w-full gradient-primary" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
