import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { DesktopOnlyGuard } from "@/components/layout/DesktopOnlyGuard";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mondwest = localFont({
  src: "../../public/fonts/ppmondwest-regular.otf",
  variable: "--font-mondwest",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Affecio Admin",
  description: "Internal operations console for the Affecio mobile application.",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("affecio-theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mondwest.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full bg-affecio-bg font-sans text-affecio-text antialiased">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <DesktopOnlyGuard>{children}</DesktopOnlyGuard>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
