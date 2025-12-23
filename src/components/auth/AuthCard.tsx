'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import Image from 'next/image';

interface AuthCardProps {
    children: React.ReactNode;
    mode: 'sign-in' | 'sign-up';
}

export function AuthCard({ children, mode }: AuthCardProps) {
    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors">
            {/* Dotted Background Pattern - matching landing page */}
            <div
                className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            {/* Subtle gradient accents for depth */}
            <div className="absolute inset-0 z-0 h-full w-full">
                <div className="absolute top-[10%] left-[10%] h-96 w-96 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-[120px]" />
                <div className="absolute bottom-[10%] right-[10%] h-96 w-96 rounded-full bg-orange-500/10 dark:bg-orange-500/20 blur-[120px]" />
            </div>

            {/* Theme Toggle - positioned in top right */}
            <div className="absolute top-6 right-6 z-20">
                <ThemeToggle />
            </div>

            {/* Main Card */}
            <div className="relative z-10 w-full max-w-[440px] rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-xl sm:p-8">

                {/* Logo and Close Button Row */}
                <div className="flex items-center justify-between mb-6">
                    <Link href="/" className="flex items-center space-x-2">
                        <Image src="/logoo.png" alt="MuseFlow" width={32} height={32} className="rounded-lg" />
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">MuseFlow</span>
                    </Link>
                    <Link href="/" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        <X className="h-4 w-4" />
                    </Link>
                </div>

                {/* Toggle Switch */}
                <div className="mb-8 flex justify-center">
                    <div className="flex h-12 items-center rounded-full bg-gray-100 dark:bg-gray-700/50 p-1 border border-gray-200 dark:border-gray-600">
                        <Link
                            href="/sign-up"
                            className={cn(
                                "flex h-full items-center rounded-full px-6 text-sm font-medium transition-all",
                                mode === 'sign-up'
                                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            )}
                        >
                            Sign up
                        </Link>
                        <Link
                            href="/sign-in"
                            className={cn(
                                "flex h-full items-center rounded-full px-6 text-sm font-medium transition-all",
                                mode === 'sign-in'
                                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            )}
                        >
                            Sign in
                        </Link>
                    </div>
                </div>

                {/* Content */}
                <div>
                    {children}
                </div>

                {/* Footer Text */}
                <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    By creating an account, you agree to our{' '}
                    <Link href="#" className="text-orange-600 dark:text-blue-400 hover:underline">Terms of Service</Link>
                </div>
            </div>
        </div>
    );
}
