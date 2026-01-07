import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/ui/Sidebar";

export const metadata: Metadata = {
  title: "FHIR Clinic — PHCore Compliant Healthcare System",
  description: "A FHIR R4 compliant clinic management system following Philippine Core (PHCore) standards for healthcare data interoperability.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-screen overflow-hidden bg-slate-50" suppressHydrationWarning>
        <div className="flex h-full w-full">
          <Sidebar />
          <main className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto pt-16 md:pt-0">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}