'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PlanTier } from '@/lib/payments/types';
import { FeatureKey, FeatureAccessResult } from '@/lib/plans/featureGates';
import { getPlanGateSummaryAction, PlanGateSummary } from '@/lib/plans/planActions';
import { FeatureGateModal } from '@/components/paywall/FeatureGateModal';

interface PlanGateContextType {
  plan: PlanTier;
  isPaid: boolean;
  isLoading: boolean;
  canAccess: (feature: FeatureKey) => boolean;
  getFeatureResult: (feature: FeatureKey) => FeatureAccessResult | undefined;
  openGate: (feature: FeatureKey, customTitle?: string, customDescription?: string) => void;
  refreshPlanAccess: () => Promise<void>;
}

const PlanGateContext = createContext<PlanGateContextType | undefined>(undefined);

export function PlanGateProvider({ children }: { children: React.ReactNode }) {
  const [summary, setSummary] = useState<PlanGateSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<FeatureKey | null>(null);
  const [customTitle, setCustomTitle] = useState<string | undefined>();
  const [customDesc, setCustomDesc] = useState<string | undefined>();

  const refreshPlanAccess = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getPlanGateSummaryAction();
      setSummary(data);
    } catch (err) {
      console.warn('[PlanGateProvider] Failed to fetch plan access summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPlanAccess();
  }, [refreshPlanAccess]);

  const canAccess = useCallback(
    (feature: FeatureKey): boolean => {
      if (!summary) return true; // optimistic default during hydration
      return summary.features[feature]?.allowed ?? true;
    },
    [summary]
  );

  const getFeatureResult = useCallback(
    (feature: FeatureKey): FeatureAccessResult | undefined => {
      return summary?.features[feature];
    },
    [summary]
  );

  const openGate = useCallback(
    (feature: FeatureKey, title?: string, description?: string) => {
      setActiveFeature(feature);
      setCustomTitle(title);
      setCustomDesc(description);
      setIsModalOpen(true);
    },
    []
  );

  const activeResult = activeFeature ? summary?.features[activeFeature] : undefined;

  return (
    <PlanGateContext.Provider
      value={{
        plan: summary?.plan || 'free',
        isPaid: summary?.isPaid || false,
        isLoading,
        canAccess,
        getFeatureResult,
        openGate,
        refreshPlanAccess,
      }}
    >
      {children}

      {/* Global Gating Modal */}
      <FeatureGateModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        feature={activeFeature}
        currentUsage={activeResult?.current}
        limit={activeResult?.limit}
        customTitle={customTitle}
        customDescription={customDesc}
      />
    </PlanGateContext.Provider>
  );
}

export function useFeatureGate() {
  const context = useContext(PlanGateContext);
  if (!context) {
    throw new Error('useFeatureGate must be used within a PlanGateProvider');
  }
  return context;
}
