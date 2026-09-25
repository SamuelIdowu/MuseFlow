'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { FeatureKey, FEATURE_DEFINITIONS } from '@/lib/plans/featureGates';

interface InlineFeatureGateProps {
  feature: FeatureKey;
  onUpgradeClick?: () => void;
  className?: string;
}

export function InlineFeatureGate({
  feature,
  onUpgradeClick,
  className = '',
}: InlineFeatureGateProps) {
  const meta = FEATURE_DEFINITIONS[feature];

  return (
    <Card
      className={`border-amber-500/30 bg-gradient-to-r from-amber-500/5 via-primary/5 to-transparent shadow-xs overflow-hidden ${className}`}
    >
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 mt-0.5 sm:mt-0">
            <Lock className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-foreground tracking-tight">
                {meta?.name || 'Pro Feature'}
              </h4>
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold py-0"
              >
                {meta?.badge || 'Freelancer Pro'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
              {meta?.description}
            </p>
          </div>
        </div>

        <Button
          onClick={onUpgradeClick}
          size="sm"
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium shrink-0 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Unlock with Pro</span>
          <ArrowRight className="w-3 h-3" />
        </Button>
      </CardContent>
    </Card>
  );
}
