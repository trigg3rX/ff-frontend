"use client";

import React, { useState, useCallback, useEffect } from "react";
import { LuSparkles, LuX, LuLoaderCircle, LuInfo, LuArrowRight, LuWand } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { useWorkflow } from "@/context/WorkflowContext";
import { cn } from "@/lib/utils";

interface WorkflowAssistantProps {
  open: boolean;
  onClose: () => void;
  className?: string;
}

type GenerateState = "idle" | "loading" | "success" | "error";

const SUGGESTIONS = [
  "Swap USDC to ETH on lifi and prompt me mail if done",
  "Use ChatGPT's brain and swap 0.1 ETH for USDC on Uniswap, notify on Telegram if done",
  "Fetch latest price from Chainlink and log to Slack",
  "When ETH price goes above $3000, send a Telegram alert",
];

export function WorkflowAssistant({
  open,
  onClose,
  className,
}: WorkflowAssistantProps) {
  const { applyGeneratedWorkflow } = useWorkflow();
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<GenerateState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  const handleGenerate = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setState("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/ai/generate-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMessage(data?.error || "Failed to generate workflow");
        setState("error");
        return;
      }

      const applied = applyGeneratedWorkflow({
        workflowName: data.workflowName ?? "Untitled Workflow",
        steps: data.steps ?? [],
      });

      if (applied) {
        setState("success");
        setPrompt("");
        onClose();
      } else {
        setErrorMessage("No valid blocks could be added to the canvas.");
        setState("error");
      }
    } catch (e) {
      setErrorMessage(
        e instanceof Error ? e.message : "Something went wrong"
      );
      setState("error");
    }
  }, [prompt, applyGeneratedWorkflow, onClose]);

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6",
            className
          )}
          role="dialog"
          aria-modal="true"
        >
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xl"
            onClick={handleBackdropClick}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "relative z-10 w-full max-w-2xl overflow-hidden",
              "bg-zinc-900/80 border border-white/10 rounded-3xl shadow-2xl shadow-black/50",
              "backdrop-blur-2xl flex flex-col"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-0 w-full lg:h-48 h-32 bg-linear-to-b from-amber-500/10 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-center justify-between px-8 py-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <LuSparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">AI Workflow Designer</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-full border border-white/5"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="relative p-8 space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-semibold text-white/80 flex items-center gap-2">
                  <LuWand className="w-4 h-4 text-amber-400" />
                  What should this workflow do?
                </label>

                <div className="relative group">
                  <Textarea
                    placeholder="Describe your workflow in your word..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={state === "loading"}
                    rows={4}
                    className={cn(
                      "resize-none bg-black/40 border-white/10 text-white placeholder:text-white/20 rounded-2xl p-4",
                      "focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all duration-300",
                      "text-base leading-relaxed"
                    )}
                  />

                  {state === "loading" && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-2xl flex items-center justify-center flex-col gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      >
                        <LuLoaderCircle className="w-8 h-8 text-amber-500" />
                      </motion.div>
                      <p className="text-sm font-medium text-amber-500">Crafting your workflow...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Suggestions */}
              {state !== "loading" && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-white/30 uppercase tracking-[0.1em]">Try these examples</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={cn(
                          "text-left text-sm px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-white/60",
                          "hover:bg-amber-500/10 hover:border-amber-500/30 hover:text-white transition-all duration-200",
                          "flex items-center justify-between group"
                        )}
                      >
                        <span className="truncate">{suggestion}</span>
                        <LuArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              <AnimatePresence>
                {state === "error" && errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="flex items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"
                    role="alert"
                  >
                    <LuInfo className="h-5 w-5 shrink-0" />
                    <span className="font-medium">{errorMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-8 py-2 border-t border-white/5 flex items-center justify-center gap-4">
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || state === "loading"}
                className={cn(
                  "px-8 h-12 rounded-xl text-white font-bold transition-all duration-300",
                  "flex items-center gap-2 border-0"
                )}
              >
                {state === "loading" ? (
                  <>
                    Designing...
                  </>
                ) : (
                  <>
                    Generate Workflow
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
