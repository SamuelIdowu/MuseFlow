'use client';

import { Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { FEATURES, getPlanTierOverride } from '@/lib/featureFlags';

export function UpgradeCard() {
    const { plan } = useFeatureGate();
    const activePlan = plan || getPlanTierOverride() || 'free';

    // Studio / Business Tier or full access
    if (activePlan === 'business' || activePlan === 'studio' || (!FEATURES.PAYMENTS_ENABLED && !getPlanTierOverride() && !FEATURES.ENFORCE_PLAN_LIMITS)) {
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
                        {activePlan === 'studio' ? 'Studio Plan Active' : 'All Features Unlocked'}
                    </h3>

                    <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                        Unlimited access enabled!
                    </p>
                </div>
            </div>
        );
    }

    // Freelancer Pro Tier
    if (activePlan === 'pro') {
        return (
            <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-700/50 shadow-xl relative overflow-hidden">
                <div className="relative z-10 text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 mb-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    </div>

                    <h3 className="text-[13px] font-semibold text-white mb-0.5">
                        Freelancer Pro Active
                    </h3>

                    <p className="text-[11px] text-slate-400 mb-3 leading-tight">
                        Unlimited canvases & scheduled posts enabled.
                    </p>

                    <Link href="/pricing" className="block w-full">
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full h-7 text-[12px] border-indigo-500/30 hover:bg-indigo-500/20 text-white"
                        >
                            Explore Studio
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // Free Starter Tier
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
                    Upgrade to Pro
                </h3>

                <p className="text-[11px] text-slate-400 mb-3 leading-tight">
                    Unlimited AI generations, custom voices, and campaigns.
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
