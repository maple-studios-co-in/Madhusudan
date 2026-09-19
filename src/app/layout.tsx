import type { Metadata, Viewport } from "next";
import { Geist, Kulim_Park, Outfit, Poppins } from "next/font/google";
import SiteFooter from "@/components/layout/SiteFooter";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-poppins",
  display: "swap",
});

/* Stand-in for Nohemi (the paid display face in the Figma file); swap for the licensed font when available. */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-outfit",
  display: "swap",
});

const kulimPark = Kulim_Park({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-kulim",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Madhusudhan | Picked at their peak. Locked in at their best.",
  description:
    "SMC Agri Limited is a pioneer in delivering the highest quality frozen fruits and vegetables from its farms to your table, embodying a legacy of agricultural excellence since 1991.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#a23928",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${poppins.variable} ${kulimPark.variable} ${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
