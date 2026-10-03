import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

/**
 * Poppins es la tipografía de títulos de emi.edu.bo; el cuerpo usa Helvetica
 * (declarado en globals.css), igual que el sitio original.
 */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Inicio | Escuela Militar de Ingeniería",
    template: "%s | Escuela Militar de Ingeniería",
  },
  description:
    "Universidad líder en la formación de profesionales caracterizados por su responsabilidad social, liderazgo y disciplina. Sistema de parqueo inteligente para el campus de La Paz.",
  applicationName: "Sistema de Parqueo EMI",
};

export const viewport: Viewport = {
  themeColor: "#0d3669",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-BO" dir="ltr" className={`${poppins.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white">{children}</body>
    </html>
  );
}