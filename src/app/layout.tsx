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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFBFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1419" },
  ],
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "MuseFlow",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "AI Workspace for Writers & Content Creators. Ideate, visualize on infinite canvas, and publish.",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "USD",
    "lowPrice": "0",
    "highPrice": "29",
    "offerCount": "3",
    "offers": [
      {
        "@type": "Offer",
        "name": "Free Plan",
        "price": "0",
        "priceCurrency": "USD"
      },
      {
        "@type": "Offer",
        "name": "Pro Plan",
        "price": "9",
        "priceCurrency": "USD"
      },
      {
        "@type": "Offer",
        "name": "Business Plan",
        "price": "29",
        "priceCurrency": "USD"
      }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          {/* Editor fonts — Google Fonts CDN (no API key needed) */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&family=Lato:ital,wght@0,300;0,400;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Nunito:ital,wght@0,300;0,400;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Roboto+Mono:ital,wght@0,400;0,500;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,400&family=JetBrains+Mono:ital,wght@0,400;0,500;1,400&display=swap"
            rel="stylesheet"
          />
        </head>
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
