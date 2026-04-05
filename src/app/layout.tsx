import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Casas Confortables - CRM",
  description: "Sistema de gestión de leads y clientes para Casas Confortables. Gestiona tus leads, obras, clientes y equipos desde un único lugar.",
  keywords: ["CRM", "Construcción", "Leads", "Gestión", "Casas Confortables"],
  authors: [{ name: "Casas Confortables" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
