import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getThemeFor } from '../lib/theme';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Réservation Restaurant",
  description: "Réservation en ligne",
};

export default function RootLayout({ children }) {
  // Lire le slug depuis l'env (mono-restaurant par instance Vercel)
  const slug = process.env.NEXT_PUBLIC_RESTAURANT_SLUG || 'sarrasin';
  const theme = getThemeFor(slug);

  return (
    <html 
      lang="fr"
      style={{
        '--brand': theme.brand,
        '--brand-contrast': theme.brandContrast,
        '--surface': theme.surface,
        '--text': theme.text,
        '--accent': theme.accent,
      }}
    >
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[var(--surface)] text-[var(--text)]`}>
        {children}
      </body>
    </html>
  );
}
