import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import { EnokiProviders } from "@/components/providers/EnokiProviders";
import "./globals.css";
import "@mysten/dapp-kit/dist/index.css";

const anton = Anton({
  weight: "400",
  variable: "--font-anton",
  subsets: ["latin"],
});

const inter = Inter({
  weight: ["400", "600", "800"],
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Data Exchange - Unlock Your Data",
  description:
    "Monetize your insights securely. Built on Walrus, Seal, and Nautilus for unstoppable decentralized data trading.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  // Default to light theme unless 'dark' is explicitly set
                  const shouldBeDark = stored === 'dark';
                  if (shouldBeDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${anton.variable} ${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <EnokiProviders>{children}</EnokiProviders>
      </body>
    </html>
  );
}
