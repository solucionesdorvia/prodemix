import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ProdeMix",
    template: "%s · ProdeMix",
  },
  description:
    "Pronósticos de futsal con pools por fecha y prodes privados. Reglas claras, ranking y resultados.",
  applicationName: "ProdeMix",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F7F8FA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className={`${plusJakarta.variable} h-full antialiased`}>
      <body className="min-h-dvh flex flex-col bg-app-bg text-app-text">
        {children}
      </body>
    </html>
  );
}
