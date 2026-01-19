import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { MomoLogo } from "./MomoLogo";

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
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        isScrolled ? "glass py-3 momo-shadow" : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center group">
          <MomoLogo size="md" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-12">
          <a
            href="#avatars"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            Compagni
          </a>
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            Come funziona
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            Piani
          </a>
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ghost" className="font-medium text-muted-foreground" asChild>
            <Link to="/login">Accedi</Link>
          </Button>
          <Button 
            className="gradient-primary glow-primary font-semibold px-8 py-6 rounded-3xl" 
            asChild
          >
            <Link to="/signup">Inizia ora</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-3 rounded-2xl hover:bg-secondary transition-colors duration-300"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-foreground" />
          ) : (
            <Menu className="w-6 h-6 text-foreground" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="md:hidden glass mt-4 mx-6 rounded-3xl p-8 space-y-4 momo-shadow"
        >
          <a
            href="#avatars"
            className="block text-base font-medium text-muted-foreground hover:text-foreground py-3"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Compagni
          </a>
          <a
            href="#features"
            className="block text-base font-medium text-muted-foreground hover:text-foreground py-3"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Come funziona
          </a>
          <a
            href="#pricing"
            className="block text-base font-medium text-muted-foreground hover:text-foreground py-3"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Piani
          </a>
          <div className="flex flex-col gap-4 pt-6 border-t border-border">
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-muted-foreground">Tema</span>
              <ThemeToggle />
            </div>
            <Button variant="ghost" className="w-full rounded-2xl" asChild>
              <Link to="/login">Accedi</Link>
            </Button>
            <Button className="w-full gradient-primary glow-primary rounded-2xl py-6" asChild>
              <Link to="/signup">Inizia ora</Link>
            </Button>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
