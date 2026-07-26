import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linkbox | Dijital Kütüphane",
  description: "Kişisel link kaydetme, etiketleme ve arama uygulaması",
};

/** Kök yerleşim: koyu tema, Outfit + Inter fontları (tasarım referansıyla aynı kaynak). */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className="dark" lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-on-background antialiased">
        {children}
      </body>
    </html>
  );
}
