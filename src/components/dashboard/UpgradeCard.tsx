'use client';

import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function UpgradeCard() {
    return (
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-xl relative overflow-hidden group">
            {/* Glow Effects */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl group-hover:bg-orange-500/30 transition-all duration-500" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all duration-500" />

            <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 mb-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 shadow-inner">
                    <Sparkles className="w-5 h-5 text-orange-400" />
                </div>

                <h3 className="text-sm font-semibold text-white mb-1">
                    Upgrade to Premium
                </h3>

                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Unlock unlimited AI generation, advanced analytics, and priority support.
                </p>

                <Link href="/pricing" className="block w-full">
                    <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white border-0 shadow-lg shadow-orange-500/20"
                    >
                        Upgrade
                    </Button>
                </Link>
            </div>
        </div>
    );
}
