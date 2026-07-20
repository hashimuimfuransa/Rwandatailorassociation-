import type { Metadata } from "next";
import { Poppins, Manrope } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/components/LanguageProvider";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rwanda Tailors Association | Empowering Tailors, Building Rwanda",
  description:
    "The official association representing tailors across Rwanda. Together we promote quality, innovation, business growth and a stronger tailoring industry.",
  keywords: [
    "Rwanda Tailors Association",
    "RTA",
    "Rwanda fashion industry",
    "tailoring Rwanda",
    "Made in Rwanda",
  ],
  openGraph: {
    title: "Rwanda Tailors Association",
    description:
      "Empowering Tailors. Building Rwanda. The official association representing tailors across Rwanda.",
    locale: "en_RW",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-ink">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
