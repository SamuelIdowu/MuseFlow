'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Zap,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { FeatureKey, FEATURE_DEFINITIONS } from '@/lib/plans/featureGates';
import { createSubscriptionCheckout } from '@/server/actions/billing';
import { toast } from 'react-hot-toast';

const FEATURE_ICONS: Record<FeatureKey, React.ComponentType<{ className?: string }>> = {
  scheduled_posts: Calendar,
  canvas_sessions: Layers,
  ai_generations: Sparkles,
  brand_profiles: Zap,
  saved_campaigns: Sparkles,
};

export interface FeatureGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: FeatureKey | null;
  currentUsage?: number;
  limit?: number | 'unlimited';
  customTitle?: string;
  customDescription?: string;
}

export function FeatureGateModal({
  open,
  onOpenChange,
  feature,
  currentUsage,
  limit,
  customTitle,
  customDescription,
}: FeatureGateModalProps) {
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const meta = feature ? FEATURE_DEFINITIONS[feature] : null;
  const IconComponent = feature ? FEATURE_ICONS[feature] || Zap : Zap;

  const title = customTitle || meta?.name || 'Upgrade to Freelancer Pro';
  const description =
    customDescription ||
    meta?.description ||
    'Unlock unlimited access to high-impact creation tools designed for modern creators.';

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      const toastId = toast.loading('Initializing checkout...');

      const result = await createSubscriptionCheckout(
        'pro',
        'monthly',
        typeof window !== 'undefined' ? window.location.pathname : '/dashboard'
      );

      toast.dismiss(toastId);

      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        router.push('/pricing');
        onOpenChange(false);
      }
    } catch (err: any) {
      console.warn('[FeatureGateModal] Checkout fallback to pricing page:', err);
      router.push('/pricing');
      onOpenChange(false);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-border/60 shadow-2xl bg-card">
        {/* Top Glow & Header */}
        <div className="relative bg-gradient-to-br from-amber-500/10 via-primary/5 to-transparent p-6 pb-4 border-b border-border/40">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
              <IconComponent className="w-6 h-6" />
            </div>
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold px-2.5 py-0.5"
            >
              {meta?.badge || 'Freelancer Pro'}
            </Badge>
          </div>

          <DialogHeader className="text-left space-y-1.5">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>

          {/* Usage Meter (if applicable) */}
          {currentUsage !== undefined && limit !== undefined && limit !== 'unlimited' && (
            <div className="mt-4 p-3 rounded-xl bg-background/80 border border-border/50">
              <div className="flex justify-between items-center text-xs font-medium mb-1.5">
                <span className="text-muted-foreground">Current Plan Usage</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  {currentUsage} of {limit} used
                </span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round((currentUsage / (limit as number)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Pro Benefits Checklist */}
        <div className="p-6 space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Included in Freelancer Pro ($19/mo)
          </p>

          <ul className="space-y-2.5">
            {(meta?.benefits || [
              'Unlimited Canvas Workspaces',
              'Post Scheduling & Calendar Sync',
              '500 Monthly AI Generations',
              'Up to 10 Brand Personas',
            ]).map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground/90">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-6 pt-2 bg-muted/20 border-t border-border/40 flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isUpgrading}
            className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
          >
            Maybe later
          </Button>

          <Button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="w-full sm:flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium shadow-md shadow-primary/20"
          >
            {isUpgrading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Opening Checkout...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Upgrade to Pro — $19/mo</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
