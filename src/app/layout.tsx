import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Provider } from './provider'

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Hotel Email Booker",
  description: "Find hotel emails and ask for cheaper prices or special wishes.",
  manifest: "/manifest.json",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#319795" />
      </head>
      <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
      <Provider>{children}</Provider>
      </body>
      </html>
  );
}
