"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" className="w-12 h-12 flex items-center justify-center">
                <Sun className="size-8" />
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-12 h-12 flex items-center justify-center"
        >
            {theme === "dark" ? (
                <Sun className="size-8 text-gray-400 hover:text-gray-100 transition-colors" />
            ) : (
                <Moon className="size-8 text-gray-600 hover:text-gray-900 transition-colors" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
