import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Visualizador de Carrossel de Ano Novo 2025",
  description: "Visualize como suas tendências de Réveillon 2025 ficarão no feed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body
        className={`${playfair.variable} ${plusJakarta.variable} antialiased font-sans bg-gray-100 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}

