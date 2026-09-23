import type { Metadata } from "next";
import { Outfit, Inter, Noto_Sans_Gujarati, Anton, Bebas_Neue, Montserrat, Poppins } from "next/font/google";
import "@/design/tokens.css";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { CommandPalette } from "@/components/common/CommandPalette";
import { Toaster } from "sonner";
import { ClientInit } from "@/components/common/ClientInit";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const gujarati = Noto_Sans_Gujarati({
  subsets: ["gujarati"],
  variable: "--font-gujarati",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const anton = Anton({
  subsets: ["latin"],
  variable: "--font-anton",
  weight: "400",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-bebas",
  weight: "400",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "600", "700", "800", "900"],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Prarambh Reel Studio — Surat ના સમાચાર, હવે Reels માં.",
  description: "AI-Powered Hyperlocal Gujarati Instagram Reel Production Studio",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="gu" className="light bg-[#F8F9FA]">
      <body className={`${outfit.variable} ${inter.variable} ${gujarati.variable} ${anton.variable} ${bebas.variable} ${montserrat.variable} ${poppins.variable} font-inter bg-[#F8F9FA] text-[#1F2937] antialiased flex h-screen overflow-hidden`}>
        <ClientInit />
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-hidden relative">
            {children}
          </main>
        </div>
        <CommandPalette />
        <Toaster 
          position="top-right" 
          richColors 
          theme="light"
          toastOptions={{
            style: {
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              color: '#1F2937',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            }
          }}
        />
      </body>
    </html>
  );
}
