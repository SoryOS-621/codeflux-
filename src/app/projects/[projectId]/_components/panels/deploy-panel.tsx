/**
 * @file _components/panels/deploy-panel.tsx
 * @description Slide-out deployment panel with pre-deploy checks,
 * deployment step visualization, and post-deploy production URL.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Copy,
  RotateCcw,
  Shield,
  Server,
  Package,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Separator available for future use
import { useSandboxStore } from "@/stores/sandbox-store";

interface DeployPanelProps {
  open: boolean;
  onClose: () => void;
  buildStatus: "idle" | "building" | "success" | "failed";
  previewUrl: string | null;
}

type DeployStep = "checks" | "building" | "uploading" | "provisioning" | "live";

interface CheckItem {
  id: string;
  label: string;
  status: "pass" | "fail" | "warning" | "checking";
}

export function DeployPanel({ open, onClose, buildStatus, previewUrl }: DeployPanelProps) {
  const { deployStatus: _deployStatus } = useSandboxStore();
  const [currentStep, setCurrentStep] = useState<DeployStep>("checks");
  const [productionUrl, setProductionUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const checks: CheckItem[] = [
    {
      id: "build",
      label: "Build succeeds",
      status: buildStatus === "success" ? "pass" : buildStatus === "failed" ? "fail" : "checking",
    },
    {
      id: "errors",
      label: "No runtime errors",
      status: buildStatus === "success" ? "pass" : buildStatus === "failed" ? "warning" : "checking",
    },
    {
      id: "env",
      label: "Env vars configured",
      status: "pass", // Placeholder
    },
    {
      id: "preview",
      label: "Preview loads",
      status: previewUrl ? "pass" : "warning",
    },
  ];

  const allChecksPassed = checks.every((c) => c.status === "pass");

  const steps: { id: DeployStep; label: string; icon: React.ElementType }[] = [
    { id: "checks", label: "Pre-deploy checks", icon: Shield },
    { id: "building", label: "Building", icon: Package },
    { id: "uploading", label: "Uploading", icon: Server },
    { id: "provisioning", label: "Provisioning", icon: Globe },
    { id: "live", label: "Live", icon: Rocket },
  ];

  // Simulate deployment steps
  const handleDeploy = () => {
    setCurrentStep("building");
    setTimeout(() => setCurrentStep("uploading"), 2000);
    setTimeout(() => setCurrentStep("provisioning"), 4000);
    setTimeout(() => {
      setCurrentStep("live");
      setProductionUrl("https://your-app.vercel.app");
    }, 6000);
  };

  const handleCopy = () => {
    if (productionUrl) {
      navigator.clipboard.writeText(productionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const stepIdx = steps.findIndex((s) => s.id === currentStep);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[380px] bg-background border-l shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-4 border-b shrink-0">
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Deploy</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Step progress */}
            <div className="px-4 py-3 border-b">
              <div className="flex items-center justify-between">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = idx === stepIdx;
                  const isDone = idx < stepIdx;
                  return (
                    <div key={step.id} className="flex items-center">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-300",
                          isDone
                            ? "bg-emerald-500/10 text-emerald-400"
                            : isActive
                              ? "bg-blue-500/10 text-blue-400 ring-2 ring-blue-500/20"
                              : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : isActive && currentStep !== "checks" && currentStep !== "live" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Icon className="h-3.5 w-3.5" />
                        )}
                      </div>
                      {idx < steps.length - 1 && (
                        <div
                          className={cn(
                            "w-6 h-px mx-1",
                            isDone ? "bg-emerald-400/40" : "bg-border"
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                {steps[stepIdx].label}
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {currentStep === "checks" && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Pre-deployment checks ensure your app is ready for production.
                  </p>
                  <div className="space-y-2">
                    {checks.map((check) => (
                      <div
                        key={check.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card/50"
                      >
                        {check.status === "pass" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                        {check.status === "fail" && <AlertTriangle className="h-4 w-4 text-red-400" />}
                        {check.status === "warning" && <AlertTriangle className="h-4 w-4 text-amber-400" />}
                        {check.status === "checking" && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
                        <span className="text-sm flex-1">{check.label}</span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[9px] h-4 px-1.5",
                            check.status === "pass" && "bg-emerald-500/10 text-emerald-400",
                            check.status === "fail" && "bg-red-500/10 text-red-400",
                            check.status === "warning" && "bg-amber-500/10 text-amber-400",
                          )}
                        >
                          {check.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {currentStep === "live" && productionUrl && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium">Deployed Successfully!</p>
                    <p className="text-xs text-muted-foreground">Your app is live and accessible.</p>
                  </div>

                  <div className="rounded-lg border bg-card/50 p-3 space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Production URL</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono text-primary truncate">
                        {productionUrl}
                      </code>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleCopy}>
                        <Copy className={cn("h-3 w-3", copied && "text-emerald-400")} />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1 gap-1.5" size="sm" asChild>
                      <a href={productionUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                        Open
                      </a>
                    </Button>
                    <Button variant="outline" className="flex-1 gap-1.5" size="sm" onClick={() => {
                      setCurrentStep("checks");
                      setProductionUrl(null);
                    }}>
                      <RotateCcw className="h-3 w-3" />
                      Redeploy
                    </Button>
                  </div>
                </div>
              )}

              {currentStep !== "checks" && currentStep !== "live" && (
                <div className="flex flex-col items-center gap-3 py-12">
                  <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                  <p className="text-sm">{steps[stepIdx].label}...</p>
                  <p className="text-xs text-muted-foreground">This may take a moment.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-4 shrink-0">
              {currentStep === "checks" && (
                <Button
                  className="w-full gap-1.5"
                  disabled={!allChecksPassed}
                  onClick={handleDeploy}
                >
                  <Rocket className="h-3.5 w-3.5" />
                  {allChecksPassed ? "Deploy to Production" : "Fix issues to deploy"}
                </Button>
              )}
              {currentStep === "live" && (
                <Button variant="outline" className="w-full" onClick={onClose}>
                  Done
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
