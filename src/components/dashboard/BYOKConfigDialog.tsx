"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { KeyRound, Sparkles, ShieldCheck, Cpu } from "lucide-react";
import {
  configureProfileBYOK,
  removeProfileBYOK,
  getProfileBYOKStatus,
} from "@/lib/researchAgentClient";

interface BYOKConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profileName: string;
}

export function BYOKConfigDialog({
  open,
  onOpenChange,
  profileId,
  profileName,
}: BYOKConfigDialogProps) {
  const [isBYOKEnabled, setIsBYOKEnabled] = useState(false);
  const [provider, setProvider] = useState<"google" | "openai" | "anthropic">("google");
  const [model, setModel] = useState("gemini-2.0-flash");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!open || !profileId) return;

    let isMounted = true;
    setFetching(true);

    getProfileBYOKStatus(profileId)
      .then((status) => {
        if (!isMounted) return;
        if (status.byok_configured) {
          setIsBYOKEnabled(true);
          setProvider((status.llm_provider as any) || "google");
          setModel(status.llm_model || "gemini-2.0-flash");
        } else {
          setIsBYOKEnabled(false);
        }
      })
      .finally(() => {
        if (isMounted) setFetching(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, profileId]);

  const handleProviderChange = (val: "google" | "openai" | "anthropic") => {
    setProvider(val);
    if (val === "google") setModel("gemini-2.0-flash");
    else if (val === "openai") setModel("gpt-4o");
    else if (val === "anthropic") setModel("claude-3-5-sonnet-20241022");
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (!isBYOKEnabled) {
        // Revert to Platform Default Model
        await removeProfileBYOK(profileId);
        toast.success("Restored Platform Default Model (Gemini 2.0 Flash)");
        onOpenChange(false);
        return;
      }

      if (!apiKey.trim()) {
        toast.error("Please enter a valid API key for your chosen provider");
        setLoading(false);
        return;
      }

      await configureProfileBYOK(profileId, {
        llm_provider: provider,
        llm_model: model,
        llm_api_key: apiKey.trim(),
      });

      toast.success(`BYOK configured successfully using ${model}!`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update BYOK settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Cpu className="h-5 w-5 text-indigo-500" />
            Model & BYOK Settings
          </DialogTitle>
          <DialogDescription>
            Configure the AI model and API keys used for <strong>{profileName}</strong>.
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
            Loading model configuration...
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Toggle BYOK vs Platform Default */}
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-sm">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Bring Your Own Key (BYOK)
                </div>
                <div className="text-xs text-muted-foreground">
                  {isBYOKEnabled
                    ? "Using your private LLM provider key (Unlimited usage)"
                    : "Using Museflow Platform Default (Gemini 2.0 Flash)"}
                </div>
              </div>
              <Switch checked={isBYOKEnabled} onCheckedChange={setIsBYOKEnabled} />
            </div>

            {isBYOKEnabled ? (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="space-y-2">
                  <Label>LLM Provider</Label>
                  <Select value={provider} onValueChange={(v: any) => handleProviderChange(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Gemini</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                      {provider === "google" && (
                        <>
                          <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash (Recommended)</SelectItem>
                          <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                        </>
                      )}
                      {provider === "openai" && (
                        <>
                          <SelectItem value="gpt-4o">GPT-4o (Omni)</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
                          <SelectItem value="o1-preview">o1-preview (Reasoning)</SelectItem>
                        </>
                      )}
                      {provider === "anthropic" && (
                        <>
                          <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Latest)</SelectItem>
                          <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center justify-between">
                    <span>API Key</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      Encrypted at rest (MultiFernet)
                    </span>
                  </Label>
                  <Input
                    type="password"
                    placeholder={`Enter your ${provider === "google" ? "AI Studio" : provider} API Key...`}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Your key is securely encrypted and only used to generate content for this profile.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs space-y-1">
                <div className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  Platform Default Active
                </div>
                <p className="text-emerald-600/90 dark:text-emerald-400">
                  Generations are powered by <strong>Gemini 2.0 Flash</strong> and included in your standard plan tier. No API key configuration required.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || fetching}>
            {loading ? "Saving..." : isBYOKEnabled ? "Save BYOK Settings" : "Use Platform Default"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
