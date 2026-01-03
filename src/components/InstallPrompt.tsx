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
    // We allow rendering if it IS iOS (to show instructions) or if we have a prompt (Android/Desktop)
    if (!deferredPrompt && !isIOS) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-white dark:bg-zinc-900 shadow-xl rounded-xl border border-zinc-200 dark:border-zinc-800 max-w-sm">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg dark:text-white">Install App</h3>
                <button
                    onClick={() => setDeferredPrompt(null)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
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
                        Install this application on your home screen for quick and easy access.
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
