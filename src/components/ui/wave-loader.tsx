"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface WaveLoaderProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export function WaveLoader({
  message = "LOADING",
  className,
  size = "md",
  fullScreen = false,
}: WaveLoaderProps) {
  // Heights in px according to size
  const heightMultiplier = size === "sm" ? 0.75 : size === "lg" ? 1.3 : 1;
  const barHeights = [20, 36, 52, 64, 48, 32, 18].map((h) => Math.round(h * heightMultiplier));
  const barWidth = size === "sm" ? "w-1" : size === "lg" ? "w-2.5" : "w-1.5";
  const gap = size === "sm" ? "gap-1" : size === "lg" ? "gap-2.5" : "gap-1.5";

  const loaderContent = (
    <div className={cn("relative flex flex-col items-center justify-center gap-5 select-none", className)}>
      {/* Ambient Pulsing Glow Halo */}
      <motion.div
        animate={{
          scale: [0.9, 1.25, 0.9],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-28 h-28 rounded-full bg-primary/20 blur-xl pointer-events-none -top-4"
      />

      {/* Soundwave Equalizer Bars */}
      <div
        className={cn("flex items-center justify-center relative z-10", gap)}
        style={{ height: Math.max(...barHeights) + 8 }}
      >
        {barHeights.map((height, index) => (
          <motion.span
            key={index}
            className={cn(
              barWidth,
              "rounded-full bg-primary shadow-[0_0_12px_rgba(234,88,12,0.45)] dark:shadow-[0_0_18px_rgba(234,88,12,0.65)] origin-center"
            )}
            style={{
              height: `${height}px`,
              transformOrigin: "center",
            }}
            animate={{
              scaleY: [0.2, 1, 0.2],
              opacity: [0.45, 1, 0.45],
            }}
            transition={{
              duration: 1.1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.12,
            }}
          />
        ))}
      </div>

      {/* Styled Loading Caption */}
      {message && (
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground font-mono"
        >
          {message}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xs">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
}

export default WaveLoader;
