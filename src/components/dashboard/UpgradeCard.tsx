'use client';

import { Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FEATURES } from '@/lib/featureFlags';

export function UpgradeCard() {
    // FEATURE FLAG: When payments are disabled, show "All Features Unlocked" message
    if (!FEATURES.PAYMENTS_ENABLED) {
        return (
            <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-green-900 via-emerald-800 to-green-900 border border-green-700/50 shadow-xl relative overflow-hidden">
                {/* Glow Effects */}
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-green-500/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl" />

                <div className="relative z-10 text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 mb-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 shadow-inner">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>

                    <h3 className="text-[13px] font-semibold text-white mb-1">
                        All Features Unlocked
                    </h3>

                    <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                        Enjoy unlimited access!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 shadow-xl relative overflow-hidden group">
            {/* Glow Effects */}
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-orange-500/20 rounded-full blur-2xl group-hover:bg-orange-500/30 transition-all duration-500" />
            <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all duration-500" />

            <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 mb-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 shadow-inner">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                </div>

                <h3 className="text-[13px] font-semibold text-white mb-0.5">
                    Upgrade to Premium
                </h3>

                <p className="text-[11px] text-slate-400 mb-3 leading-tight">
                    Unlock unlimited AI generation and priority support.
                </p>

                <Link href="/pricing" className="block w-full">
                    <Button
                        size="sm"
                        className="w-full h-7 text-[12px] bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white border-0 shadow-lg shadow-orange-500/20"
                    >
                        Upgrade
                    </Button>
                </Link>
            </div>
        </div>
    );
}
