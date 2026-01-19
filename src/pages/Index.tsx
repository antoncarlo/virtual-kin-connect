import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { AvatarGallery } from "@/components/AvatarGallery";
import { FeaturesSection } from "@/components/FeaturesSection";
import { AITransparencySection } from "@/components/AITransparencySection";
import { PricingSection } from "@/components/PricingSection";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background grid-pattern">
      <Navbar />
      <HeroSection />
      <AvatarGallery />
      <FeaturesSection />
      <AITransparencySection />
      <PricingSection />
      <Footer />
    </div>
  );
};

export default Index;
