import type { Metadata } from 'next';
import { Sora, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import './design-system.css';
import './ultra-theme.css';
import Sidebar from './components/Sidebar';
import ServiceHealthStrip from './components/ServiceHealthStrip';
import AppDock from './components/AppDock';

const sora = Sora({ subsets: ['latin'], variable: '--font-sora' });
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
});

export const metadata: Metadata = {
  title: 'Ultra AI',
  description: 'Ultra AI — multi-agent cognitive platform: Hermes core, ZeroAI local-first, model gateway, automation',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${plexMono.variable}`}>
        <div className="ultra-shell"><Sidebar /><div className="ultra-main"><ServiceHealthStrip /><main className="app-main">{children}</main><AppDock /></div></div>
      </body>
    </html>
  );
}
