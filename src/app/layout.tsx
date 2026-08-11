import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import VisitaTracker from "@/components/VisitaTracker";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yarinreels",
  description: "Streaming de filmes, séries, doramas e documentários",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "https://kwyza48uooavr0fw.public.blob.vercel-storage.com/site-logo/0387660c-c202-4ddb-92c4-c3656312f3b2.jpg" },
    ],
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport = {
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <VisitaTracker />
        {children}
      </body>
    </html>
  );
}
