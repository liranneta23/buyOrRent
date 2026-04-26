import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BuyOrRent.nl — Dutch Mortgage Calculator',
  description: 'World-class mortgage vs. renting calculator for the Dutch market (NL 2026). Compare annuity and linear mortgages with real-time market sensitivity.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className="dark">
      <body className="min-h-screen bg-[#020617] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
