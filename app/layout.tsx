import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Minimalista + futurista: Space Grotesk para textos, JetBrains Mono para cifras y etiquetas.
const sans = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-ui" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", variable: "--font-code" });

export const metadata: Metadata = {
  title: "Neoesis CRM",
  description: "Intranet de prospección de Neoesis DEVS®",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#000000" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`dark ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
