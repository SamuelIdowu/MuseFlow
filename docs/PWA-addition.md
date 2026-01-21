# Next.js Progressive Web App (PWA) Implementation Guide

This guide covers transforming a modern Next.js application (App Router, version 14/15+) into a fully functional Progressive Web App.

## Prerequisites

- Next.js 14 or 15
- App Router structure
- Node.js 18+

## 1. Installation

We will use `@ducanh2912/next-pwa`, the currently maintained community fork of the original `next-pwa` package.

```bash
npm install @ducanh2912/next-pwa
```

## 2. Configuration (next.config.mjs)

Modify your `next.config.mjs` to initialize the PWA plugin. This configuration ensures the service worker is generated only during production builds to avoid caching issues during development.

```javascript
// next.config.mjs
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development", // Disable in dev mode
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withPWA({
  // Your existing Next.js config here
  reactStrictMode: true,
});
```

## 3. The Web Manifest (app/manifest.ts)

Instead of a static `manifest.json`, use the App Router's dynamic manifest generation. Create this file at `app/manifest.ts`.

```typescript
// app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'My SaaS Application',
    short_name: 'MySaaS',
    description: 'A brief description of your application',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
```

## 4. Layout Configuration (app/layout.tsx)

You need to link the manifest and define the viewport theme color. Note that in Next.js 14+, viewport is a separate export from metadata.

```typescript
// app/layout.tsx
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "My SaaS App",
  description: "Your app description",
  manifest: "/manifest.json", // Next.js auto-generates this route from manifest.ts
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Optional: Prevents zooming (often used in native-like apps)
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## 5. Required Assets

The PWA will not work without icon files. You must create a folder named `icons` inside your `public` directory and add the following files:

- `public/icons/icon-192x192.png` (Required)
- `public/icons/icon-512x512.png` (Required)

> **Tip:** Use a tool like Maskable.app to generate these icons to ensure they look good on Android devices.

## 6. Git Ignore

The build process generates several files in your public folder that should not be committed to your repository. Add these to your `.gitignore`:

```gitignore
# PWA local files
public/sw.js
public/sw.js.map
public/workbox-*.js
public/workbox-*.js.map
```

## 7. "Install App" Component

Create a component to prompt users to install your app. This handles the logic for Chrome (Desktop/Android) and shows instructions for iOS (which doesn't support the prompt button).

**File:** `components/InstallPrompt.tsx`

```typescript
'use client';
import { useEffect, useState } from 'react';

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Check if running on iOS
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    );

    // 2. Check if already installed (standalone mode)
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    // 3. Listen for the install prompt (Chrome/Android only)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Prevent default mini-infobar
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Don't render anything if already installed
  if (isStandalone) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Render nothing if no prompt is available and not iOS (e.g. standard desktop browser without support)
  if (!deferredPrompt && !isIOS) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-white dark:bg-zinc-900 shadow-xl rounded-xl border border-zinc-200 dark:border-zinc-800 max-w-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg">Install App</h3>
        <button 
          onClick={() => setDeferredPrompt(null)} 
          className="text-zinc-400 hover:text-zinc-600"
        >
          ✕
        </button>
      </div>
      
      {isIOS ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          To install this app on your iPhone: tap <span className="font-bold">Share</span> <span className="text-xl">⎋</span> then scroll down and tap <span className="font-bold">Add to Home Screen</span> <span className="text-xl">⊕</span>.
        </p>
      ) : (
        <>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Install this application on your home screen for quick and easy access when you're on the go.
          </p>
          <button
            onClick={handleInstallClick}
            className="w-full bg-black dark:bg-white text-white dark:text-black font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
          >
            Add to Home Screen
          </button>
        </>
      )}
    </div>
  );
}
```

## 8. Testing

PWAs behave differently in development vs. production.

### Development:
The PWA features are disabled in the config above (`disable: process.env.NODE_ENV === "development"`). This is recommended because service workers cache aggressively and will prevent you from seeing your code changes instantly.

### Production Test:
To test the PWA functionality locally:

```bash
npm run build
npm start
```

Open `http://localhost:3000`. You should see the install icon in the Chrome address bar, or your custom `InstallPrompt` component should appear.