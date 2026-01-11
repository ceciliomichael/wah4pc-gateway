import { DocsSidebar } from "@/components/layout/docs-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <div className="flex h-screen relative selection:bg-blue-100 overflow-hidden">
      {/* Continuous Grid Background */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]" style={{ 
        backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", 
        backgroundSize: "40px 40px" 
      }}></div>
      
      {/* Radial Gradient Overlay (Fixed) */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-white/50 to-white/80 opacity-60"></div>

      {/* Mobile Navigation */}
      <MobileNav />
      
      {/* Desktop Sidebar */}
      <DocsSidebar />
      
      {/* Main Content - scrolls independently with its own scrollbar */}
      <main className="relative z-10 flex-1 h-full overflow-y-auto pt-14 lg:pt-0">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
          {children}
        </div>
      </main>
    </div>
  );
}