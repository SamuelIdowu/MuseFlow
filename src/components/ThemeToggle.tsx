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
            <Button variant="ghost" size="icon" className="w-9 h-9">
                <Sun className="h-4 w-4" />
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-9 h-9"
        >
            {theme === "dark" ? (
                <Sun className="h-4 w-4 text-gray-400 hover:text-gray-100 transition-colors" />
            ) : (
                <Moon className="h-4 w-4 text-gray-600 hover:text-gray-900 transition-colors" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
