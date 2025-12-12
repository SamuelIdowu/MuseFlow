'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface AuthCardProps {
    children: React.ReactNode;
    mode: 'sign-in' | 'sign-up';
}

export function AuthCard({ children, mode }: AuthCardProps) {
    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-black text-white">
            {/* Background with blurred colors to mimic aurora effect */}
            <div className="absolute inset-0 z-0 h-full w-full">
                <div className="absolute top-[20%] left-[20%] h-96 w-96 rounded-full bg-blue-600/30 blur-[100px]" />
                <div className="absolute bottom-[20%] right-[20%] h-96 w-96 rounded-full bg-purple-600/30 blur-[100px]" />
                <div className="absolute top-[50%] left-[50%] h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-600/20 blur-[100px]" />
            </div>

            {/* Main Card */}
            <div className="relative z-10 w-full max-w-[420px] rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-2xl sm:p-8">

                {/* Close Button (Optional/Decorative based on image) */}
                <div className="absolute right-4 top-4">
                    {/* If this is a modal over something, X makes sense. Since it's a page, maybe link to home? 
               For now, stick to image which shows an X, but maybe link to home or back. */}
                    <Link href="/" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                        <X className="h-4 w-4" />
                    </Link>
                </div>

                {/* Toggle Switch */}
                <div className="mb-8 flex justify-center">
                    <div className="flex h-12 items-center rounded-3xl bg-black/40 p-1">
                        <Link
                            href="/sign-up"
                            className={cn(
                                "flex h-full items-center rounded-2xl px-6 text-sm font-medium transition-all",
                                mode === 'sign-up'
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-white/50 hover:text-white/80"
                            )}
                        >
                            Sign up
                        </Link>
                        <Link
                            href="/sign-in"
                            className={cn(
                                "flex h-full items-center rounded-2xl px-6 text-sm font-medium transition-all",
                                mode === 'sign-in'
                                    ? "bg-white/10 text-white shadow-sm"
                                    : "text-white/50 hover:text-white/80"
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
                <div className="mt-8 text-center text-xs text-white/40">
                    By creating an account, you agree to our Terms & Service
                </div>
            </div>
        </div>
    );
}
