import type { Metadata } from "next";
import "./globals.css";
import { AiSidebar } from "@/components/ai/ai-sidebar";

export const metadata: Metadata = {
  title: "",
  description: "",
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
      <body suppressHydrationWarning>
        {children}
        <AiSidebar />
      </body>
    </html>
  );
}
