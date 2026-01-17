import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import MarqueeSection from "@/components/MarqueeSection";
import FeaturesSection from "@/components/FeaturesSection";
import CardsSection from "@/components/CardsSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="bg-background-light dark:bg-background-dark text-black dark:text-white font-body overflow-x-hidden transition-colors duration-300">
      <Navbar />
      <Hero />
      <MarqueeSection text="GET DATA • OWN DATA • SELL DATA •" />
      <FeaturesSection />
      <MarqueeSection
        variant="reverse"
        text="JOIN THE REVOLUTION • UNLOCK VALUE •"
        bgColor="bg-black"
      />
      <CardsSection />
      <Footer />
    </div>
  );
}
