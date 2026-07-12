import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Montserrat_Alternates } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import InstallPrompt from "@/components/InstallPrompt";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const montserrat = Montserrat_Alternates({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "MuseFlow - AI Content Ideation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MuseFlow - AI Content Ideation Platform",
    description: "Your AI content co-pilot for ideation and publishing",
    creator: "@MuseFlow",
    images: ["/twitter-card.png"],
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
          className={`${spaceGrotesk.variable} ${montserrat.variable} font-montserrat antialiased`}
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
