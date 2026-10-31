import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

/* §3: serif elegante para títulos institucionales, sans serif para datos. */
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif", weight: ["600", "700"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: "IUS MODERNUM", template: "%s · IUS MODERNUM" },
  description: "Toda la información de un asunto, en segundos.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
