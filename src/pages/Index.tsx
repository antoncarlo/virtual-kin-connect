import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { AvatarGallery } from "@/components/AvatarGallery";
import { FeaturesSection } from "@/components/FeaturesSection";
import { AITransparencySection } from "@/components/AITransparencySection";
import { PricingSection } from "@/components/PricingSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle grid pattern overlay - covers entire page */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <AvatarGallery />
        <FeaturesSection />
        <AITransparencySection />
        <PricingSection />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
