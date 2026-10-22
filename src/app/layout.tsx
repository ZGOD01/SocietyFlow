import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SocietyFlow | Digital Society Document & Approval Management Platform",
  description:
    "Your Society. Every Document. One Place. Streamlined document vaults, approvals, ownership records, and automated society governance.",
  keywords: [
    "society management",
    "housing society documents",
    "NOC approval",
    "digital society records",
    "apartment ownership transfer",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-white text-[#1A1A1A] antialiased selection:bg-[#EEF2FF] selection:text-[#4F46E5]">
        {children}
      </body>
    </html>
  );
}
