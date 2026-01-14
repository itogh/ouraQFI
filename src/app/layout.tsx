import type { Metadata } from "next";
import "./globals.css";
import { PWAInstaller } from "@/components/PWAInstaller";

export const metadata: Metadata = {
  title: "QFI — Quantified Faith Index",
  description: "Self-transcendence scoring with Ed/QFI and Proof-of-Devotion",
  manifest: "/manifest.json",
  themeColor: "#6366f1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QFI",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const theme = stored || (prefersDark ? 'dark' : 'light');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className="antialiased font-sans"
      >
        <PWAInstaller />
        {children}
      </body>
    </html>
  );
}
