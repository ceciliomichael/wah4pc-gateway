import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/stores/auth-store";

export const metadata: Metadata = {
  title: "WAH4PC Gateway Dashboard",
  description: "Administrative dashboard for WAH4PC Healthcare Gateway",
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
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
