"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Sparkles, ArrowRight, Check, Compass, Sliders, Layers, Rocket, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { createQuickProfileAction } from "@/lib/dashboardServerActions";
import { instantiateCanvasTemplateAction } from "@/features/canvas/actions/canvasActions";
import { CANVAS_TEMPLATES } from "@/features/canvas/constants/canvasTemplates";

const NICHES = [
  "Tech & AI",
  "SaaS & Startups",
  "Marketing & Growth",
  "Finance & Crypto",
  "Creator Economy",
  "Design & Product",
  "Productivity & Systems",
];

interface OnboardingWizardProps {
  hasProfile?: boolean;
}

export function OnboardingWizard({ hasProfile = false }: OnboardingWizardProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Voice Calibration
  const [personaName, setPersonaName] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("Tech & AI");
  const [toneValue, setToneValue] = useState(6); // 1 = Casual, 10 = Executive

  // Step 2: Goal & Template
  const [selectedTemplateId, setSelectedTemplateId] = useState("contrarian-take");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if user has already completed onboarding
    const completed = localStorage.getItem("museflow_onboarding_completed");
    if (!completed && !hasProfile) {
      // Delay slightly for smooth page entrance
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [hasProfile]);

  const handleDismiss = () => {
    localStorage.setItem("museflow_onboarding_completed", "true");
    setIsOpen(false);
  };

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);

      // 1. Create quick profile
      await createQuickProfileAction({
        profile_name: personaName.trim() || "My Creator Voice",
        niche: selectedNiche,
        tone_config: {
          professionalism: toneValue,
          creativity: 7,
          casualness: 11 - toneValue,
          directness: 8,
        },
        is_active: true,
      });

      // 2. Instantiate selected canvas template atomically
      const template = CANVAS_TEMPLATES.find((t) => t.id === selectedTemplateId) || CANVAS_TEMPLATES[0];
      const newSession = await instantiateCanvasTemplateAction({
        title: template.title,
        blocks: template.blocks,
        edges: template.edges,
      });

      if (newSession?.id) {
        localStorage.setItem("museflow_onboarding_completed", "true");
        setIsOpen(false);
        toast.success("Welcome to MuseFlow! Your calibrated canvas is ready.", { icon: "🚀", duration: 4000 });
        router.push(`/dashboard/canvas?session=${newSession.id}`);
      }
    } catch (err) {
      console.error("Onboarding setup failed:", err);
      toast.error("Could not complete setup. Redirecting to canvas...");
      localStorage.setItem("museflow_onboarding_completed", "true");
      setIsOpen(false);
      router.push("/dashboard/canvas");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border-border/80 shadow-2xl">
        {/* Top Progress Bar */}
        <Progress value={progressPercent} className="h-1 rounded-none bg-muted" />

        <div className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <DialogHeader className="space-y-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-md bg-primary/10 text-primary">
                <Sparkles className="w-4 h-4" />
              </span>
              <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">
                Step {step} of 2 • 60-Second Quick Start
              </Badge>
            </div>
            <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight">
              {step === 1 ? "Calibrate Your Creator Voice" : "Choose Your First Creation"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {step === 1
                ? "Configure your niche and tone matrix so MuseFlow's AI writes with your authentic cadence."
                : "Select a proven framework. We will generate your visual narrative canvas instantly."}
            </DialogDescription>
          </DialogHeader>

          {/* STEP 1: Voice Calibration */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Creator / Brand Name
                </label>
                <Input
                  placeholder="e.g. Sarah Jenkins, Tech Insights, or Founder Voice"
                  value={personaName}
                  onChange={(e) => setPersonaName(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Primary Niche
                </label>
                <div className="flex flex-wrap gap-2">
                  {NICHES.map((niche) => {
                    const isSelected = selectedNiche === niche;
                    return (
                      <button
                        key={niche}
                        type="button"
                        onClick={() => setSelectedNiche(niche)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                            : "border-border/80 hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {niche}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
                    Tone Matrix
                  </span>
                  <span className="font-medium text-primary">
                    {toneValue <= 3
                      ? "Raw & Conversational"
                      : toneValue <= 7
                      ? "Balanced & Direct"
                      : "Authoritative & Executive"}
                  </span>
                </div>
                <Slider
                  value={[toneValue]}
                  onValueChange={(vals) => setToneValue(vals[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Casual & Storyteller</span>
                  <span>Direct & Punchy</span>
                  <span>Executive Authority</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border/60">
                <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-xs text-muted-foreground">
                  Skip for now
                </Button>
                <Button onClick={() => setStep(2)} className="gap-2 text-xs font-medium">
                  Next: Pick First Goal <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Template Selection */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 gap-3">
                {CANVAS_TEMPLATES.slice(0, 3).map((tpl) => {
                  const isSelected = selectedTemplateId === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-xs"
                          : "border-border/70 hover:border-border hover:bg-muted/30"
                      }`}
                    >
                      <span className="text-2xl pt-0.5">{tpl.icon}</span>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-foreground">{tpl.title}</h4>
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {tpl.badge}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {tpl.description}
                        </p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-1 shrink-0 ${
                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border/60">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="gap-2 text-xs font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Building Canvas...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-3.5 h-3.5" />
                      Launch My Canvas
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
