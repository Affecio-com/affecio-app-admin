import type { Metadata } from "next";
import localFont from "next/font/local";
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

const mondwest = localFont({
  src: "../../public/fonts/ppmondwest-regular.otf",
  variable: "--font-mondwest",
  display: "swap",
});

const neuebit = localFont({
  src: "../../public/fonts/ppneuebit-bold.otf",
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
