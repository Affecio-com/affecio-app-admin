import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { DesktopOnlyGuard } from "@/components/layout/DesktopOnlyGuard";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

// Swap to localFont when PPMondWest-Regular.woff2 + PPNeueBit-Bold.woff2 are in public/fonts/
const mondwest = Poppins({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-mondwest",
  display: "swap",
});

const neuebit = Poppins({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-neuebit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Affecio Admin",
  description: "Affecio admin dashboard — desktop only",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${mondwest.variable} ${neuebit.variable} h-full dark`}
    >
      <body className="min-h-full bg-affecio-bg font-poppins text-affecio-text antialiased">
        <QueryProvider>
          <AuthProvider>
            <DesktopOnlyGuard>{children}</DesktopOnlyGuard>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
