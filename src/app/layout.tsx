import type { Metadata } from "next";
import { Saira } from "next/font/google";
import "./globals.css";
import { WebVitals } from "./_components/WebVitals";
import { AuthProvider } from "./contexts/AuthContext";

// Importation de la police Saira
const saira = Saira({
  variable: "--font-saira",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "payFisc - Gestion des Taxes et Impôts",
    template: "%s | payFisc",
  },
  description:
    "payFisc est une application moderne pour le suivi et le paiement sécurisé de vos taxes, impôts, redevances et contributions fiscales.",
  keywords: [
    "taxes",
    "impôts",
    "fiscalité",
    "paiement sécurisé",
    "contribution fiscale",
    "redevances",
  ],
  authors: [{ name: "payFisc Team" }],
  creator: "payFisc",
  publisher: "payFisc",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.payfisc.com"), // Remplacez par votre URL de production
  alternates: {
    canonical: "/",
    languages: {
      "fr-FR": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://www.payfisc.com",
    siteName: "payFisc",
    title: "payFisc - Gestion des Taxes et Impôts",
    description:
      "payFisc est une application moderne pour le suivi et le paiement sécurisé de vos taxes, impôts, redevances et contributions fiscales.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "payFisc - Gestion des Taxes et Impôts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "payFisc - Gestion des Taxes et Impôts",
    description:
      "Application moderne pour le suivi et le paiement sécurisé de vos taxes et impôts",
    images: ["/twitter-image.png"],
    creator: "@payfisc",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // google: 'votre-code-verification-google',
    // yandex: 'votre-code-verification-yandex',
  },
  category: "finance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${saira.variable} antialiased`}>
        {/* 🔥 Analytics Web Vitals activés sur toutes les pages */}
        <WebVitals />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
