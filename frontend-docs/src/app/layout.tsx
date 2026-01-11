import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "@/components/layout/app-layout";
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
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <body suppressHydrationWarning className="overflow-x-hidden">
        <AppLayout sidebar={<AiSidebar />}>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
