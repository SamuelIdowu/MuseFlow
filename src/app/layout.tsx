import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import InstallPrompt from "@/components/InstallPrompt";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MuseFlow - AI Content Ideation Platform",
  description: "Your AI content co-pilot for ideation and publishing",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "MuseFlow - AI Content Ideation Platform",
    description: "Your AI content co-pilot for ideation and publishing",
    url: "/",
    siteName: "MuseFlow",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MuseFlow - AI Content Ideation Platform",
    description: "Your AI content co-pilot for ideation and publishing",
    creator: "@MuseFlow",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${inter.variable} font-sans antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={true}
            disableTransitionOnChange
          >
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                className: "dark:bg-card dark:text-card-foreground",
                duration: 4000,
              }}
            />
            <InstallPrompt />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
