'use client';
import { useEffect, useState } from 'react';

const DISMISS_KEY = 'museflow_install_prompt_dismissed_at';
const COUNT_KEY = 'museflow_install_prompt_show_count';
const MAX_SHOW_COUNT = 3; // Maximum total times to auto-prompt
const DISMISS_COOLDOWN_DAYS = 7; // Days to wait before showing again after dismissal

export default function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isDismissed, setIsDismissed] = useState(true); // Default hidden until checked

    useEffect(() => {
        // 1. Check if running on iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);

        // 2. Check if already installed (standalone mode)
        const standalone = window.matchMedia('(display-mode: standalone)').matches;
        setIsStandalone(standalone);

        if (standalone) return;

        // 3. Check dismissal history & show limits in localStorage
        try {
            const lastDismissedAt = localStorage.getItem(DISMISS_KEY);
            const showCount = parseInt(localStorage.getItem(COUNT_KEY) || '0', 10);

            if (showCount >= MAX_SHOW_COUNT) {
                // User has seen/dismissed this prompt max times, suppress it
                setIsDismissed(true);
                return;
            }

            if (lastDismissedAt) {
                const daysSinceDismissed = (Date.now() - parseInt(lastDismissedAt, 10)) / (1000 * 60 * 60 * 24);
                if (daysSinceDismissed < DISMISS_COOLDOWN_DAYS) {
                    setIsDismissed(true);
                    return;
                }
            }

            // Allowed to display if conditions met
            setIsDismissed(false);
        } catch {
            // Fallback if localStorage is unavailable
            setIsDismissed(false);
        }

        // 4. Listen for the install prompt (Chrome/Android/Desktop)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault(); // Prevent default mini-infobar
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    // Don't render if installed or dismissed
    if (isStandalone || isDismissed) return null;

    const handleDismiss = () => {
        setIsDismissed(true);
        setDeferredPrompt(null);
        try {
            const currentCount = parseInt(localStorage.getItem(COUNT_KEY) || '0', 10);
            localStorage.setItem(DISMISS_KEY, Date.now().toString());
            localStorage.setItem(COUNT_KEY, (currentCount + 1).toString());
        } catch (e) {
            console.error('Failed to save install prompt dismissal to localStorage:', e);
        }
    };

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            handleDismiss();
        }
    };

    // Render nothing if no prompt is available and not iOS
    if (!deferredPrompt && !isIOS) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-white dark:bg-zinc-900 shadow-xl rounded-xl border border-zinc-200 dark:border-zinc-800 max-w-sm">
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg dark:text-white">Install App</h3>
                <button
                    onClick={handleDismiss}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 -mr-1 -mt-1 rounded-md"
                    aria-label="Close"
                >
                    ✕
                </button>
            </div>

            {isIOS ? (
                <div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                        To install this app on your iPhone: tap <span className="font-bold">Share</span> <span className="text-xl">⎋</span> then scroll down and tap <span className="font-bold">Add to Home Screen</span> <span className="text-xl">⊕</span>.
                    </p>
                    <button
                        onClick={handleDismiss}
                        className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
                    >
                        Don't show again
                    </button>
                </div>
            ) : (
                <>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                        Install this application on your home screen for quick and easy access.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleInstallClick}
                            className="flex-1 bg-black dark:bg-white text-white dark:text-black font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity text-sm"
                        >
                            Add to Home Screen
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium"
                        >
                            Not now
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
