import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import kindredLogo from "@/assets/kindred-logo.png";

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
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? "glass py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <motion.img 
            src={kindredLogo} 
            alt="Kindred" 
            className="w-10 h-10 object-contain"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          />
          <span className="text-2xl font-display font-bold text-gradient tracking-tight">
            Kindred
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-10">
          <a
            href="#avatars"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
          >
            Companions
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </a>
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
          >
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
          >
            Pricing
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </a>
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" className="font-medium" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
          <Button className="gradient-primary glow-primary font-semibold px-6" asChild>
            <Link to="/signup">Get Started Free</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
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
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden glass mt-3 mx-4 rounded-2xl p-6 space-y-4"
        >
          <a
            href="#avatars"
            className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Companions
          </a>
          <a
            href="#features"
            className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Features
          </a>
          <a
            href="#pricing"
            className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Pricing
          </a>
          <div className="flex flex-col gap-3 pt-4 border-t border-border">
            <Button variant="ghost" className="w-full" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button className="w-full gradient-primary glow-primary" asChild>
              <Link to="/signup">Get Started Free</Link>
            </Button>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
