import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
import { HowItWorks } from "@/components/sections/how-it-works";
import { CTA } from "@/components/sections/cta";

export default function HomePage() {
  return (
    <main className="relative h-full bg-white selection:bg-blue-100">
      {/* Continuous Grid Background */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]" style={{ 
        backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", 
        backgroundSize: "40px 40px" 
      }}></div>
      
      {/* Radial Gradient Overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-white/50 to-white/80 opacity-60"></div>

      <div className="relative z-10">
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
      </div>
    </main>
  );
}