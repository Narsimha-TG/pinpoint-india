import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import SiteHeader from '@/components/SiteHeader';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinpoint-india.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'Pinpoint India — Local Pincode & Places Directory', template: '%s | Pinpoint India' },
  description: 'Explore Indian pincodes, postal localities and nearby places with a practical local directory.',
  applicationName: 'Pinpoint India',
  openGraph: { type: 'website', siteName: 'Pinpoint India', title: 'Pinpoint India', description: 'A local guide to Indian pincodes and places.' },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en-IN">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <footer className="site-footer" id="about">
          <div className="footer-inner"><span className="brand"><span className="brand-mark">p</span><span>pinpoint<span className="brand-accent">.india</span></span></span><p>Local information, made easier to find.</p><p>Postal details are supplied by a third-party postal lookup. Nearby listings may be incomplete; please verify before visiting.</p><span>© {new Date().getFullYear()} Pinpoint India</span></div>
        </footer>
      </body>
    </html>
  );
}
