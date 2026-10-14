"use client";

import React, { useCallback, useMemo } from "react";
import {
    Panel,
    useViewport,
    useReactFlow,
    getViewportForBounds,
    Node,
} from "@xyflow/react";
import {
    Minus,
    Plus,
    Maximize2,
    RotateCcw,
    ChevronDown,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface CanvasZoomToolbarProps {
    nodes?: Node[];
    canvasBounds?: { x: number; y: number; width: number; height: number };
    minOverviewZoom?: number;
    className?: string;
}

/**
 * Normal canvas view is set to 0.70 scale as requested ("use 70% for 100%, it covers well").
 * At zoom = 0.70, the percentage is 100%.
 */
export const NORMAL_CANVAS_ZOOM = 0.70;

const PRESET_ZOOM_PERCENTAGES = [
    { value: 0, label: "0%", shortLabel: "0%" },
    { value: 25, label: "25%", shortLabel: "25%" },
    { value: 50, label: "50%", shortLabel: "50%" },
    { value: 75, label: "75%", shortLabel: "75%" },
    { value: 100, label: "100%", shortLabel: "100%" },
    { value: 125, label: "125%", shortLabel: "125%" },
    { value: 150, label: "150%", shortLabel: "150%" },
    { value: 200, label: "200%", shortLabel: "200%" },
    { value: 250, label: "250%", shortLabel: "250%" },
    { value: 300, label: "300%", shortLabel: "300%" },
];

/**
 * Calculates what zoom factor fits the full finite canvas workspace into the screen container.
 */
function getFullCanvasFitZoom(canvasBounds?: { x: number; y: number; width: number; height: number }): number {
    const width = canvasBounds?.width || 2200;
    const height = canvasBounds?.height || 1400;
    const x = canvasBounds?.x || 0;
    const y = canvasBounds?.y || 0;

    let containerWidth = 1200;
    let containerHeight = 800;
    if (typeof window !== "undefined") {
        const container = document.querySelector(".react-flow") as HTMLElement | null;
        if (container && container.clientWidth > 0 && container.clientHeight > 0) {
            containerWidth = container.clientWidth;
            containerHeight = container.clientHeight;
        } else {
            containerWidth = window.innerWidth * 0.75;
            containerHeight = window.innerHeight * 0.75;
        }
    }

    const vp = getViewportForBounds(
        { x, y, width, height },
        containerWidth,
        containerHeight,
        0.05,
        NORMAL_CANVAS_ZOOM,
        0.04
    );
    return Math.max(0.08, Math.min(vp.zoom, NORMAL_CANVAS_ZOOM * 0.9));
}

/**
 * Maps React Flow's zoom factor to a human-friendly percentage where:
 * - At minimum overview (covering full canvas), percentage is 0%.
 * - At NORMAL_CANVAS_ZOOM (0.70), percentage is 100% (the 70% scale that covers well).
 * - Above 100%, scales up relative to 0.70 (125%, 150%, 200%, etc.).
 */
export function calculateZoomPercentage(currentZoom: number, baseOverviewZoom: number): number {
    const safeBase = (!baseOverviewZoom || baseOverviewZoom <= 0) ? 0.35 : Math.min(baseOverviewZoom, NORMAL_CANVAS_ZOOM * 0.85);
    if (currentZoom <= safeBase + 0.015) {
        return 0;
    }
    if (Math.abs(currentZoom - NORMAL_CANVAS_ZOOM) <= 0.02) {
        return 100;
    }
    if (currentZoom > NORMAL_CANVAS_ZOOM) {
        return Math.round((currentZoom / NORMAL_CANVAS_ZOOM) * 100);
    }
    const ratio = (currentZoom - safeBase) / (NORMAL_CANVAS_ZOOM - safeBase);
    return Math.max(0, Math.min(99, Math.round(ratio * 100)));
}

/**
 * Maps target percentage back to React Flow's zoom factor:
 * - 0% returns baseOverviewZoom
 * - 100% returns NORMAL_CANVAS_ZOOM (0.70)
 * - >100% returns (percentage / 100) * NORMAL_CANVAS_ZOOM
 * - 0-100% interpolates between baseOverviewZoom and NORMAL_CANVAS_ZOOM
 */
export function percentageToZoom(percentage: number, baseOverviewZoom: number): number {
    const safeBase = (!baseOverviewZoom || baseOverviewZoom <= 0) ? 0.35 : Math.min(baseOverviewZoom, NORMAL_CANVAS_ZOOM * 0.85);
    if (percentage <= 0) {
        return safeBase;
    }
    if (percentage === 100) {
        return NORMAL_CANVAS_ZOOM;
    }
    if (percentage > 100) {
        return (percentage / 100) * NORMAL_CANVAS_ZOOM;
    }
    return safeBase + (percentage / 100) * (NORMAL_CANVAS_ZOOM - safeBase);
}

export function CanvasZoomToolbar({
    nodes = [],
    canvasBounds,
    minOverviewZoom,
    className,
}: CanvasZoomToolbarProps) {
    const { zoom } = useViewport();
    const { fitBounds, zoomTo } = useReactFlow();

    // The baseline zoom at which the full bounded canvas covers the screen (0%)
    const overviewZoom = useMemo(() => {
        if (minOverviewZoom && minOverviewZoom > 0) {
            return minOverviewZoom;
        }
        return getFullCanvasFitZoom(canvasBounds);
    }, [minOverviewZoom, canvasBounds]);

    // Current zoom represented as an integer percentage (Full canvas = 0%, 70% zoom = 100%)
    const currentPercentage = useMemo(() => {
        return calculateZoomPercentage(zoom, overviewZoom);
    }, [zoom, overviewZoom]);

    // Navigate to a specific zoom percentage
    const applyPercentage = useCallback((targetPercent: number) => {
        if (targetPercent <= 0) {
            // Cover the full canvas workspace
            if (canvasBounds && fitBounds) {
                fitBounds(
                    {
                        x: canvasBounds.x,
                        y: canvasBounds.y,
                        width: canvasBounds.width,
                        height: canvasBounds.height,
                    },
                    { padding: 0.04, duration: 300 }
                );
            } else {
                zoomTo(overviewZoom, { duration: 300 });
            }
            return;
        }
        if (targetPercent === 100) {
            zoomTo(NORMAL_CANVAS_ZOOM, { duration: 300 });
            return;
        }
        const targetZ = percentageToZoom(targetPercent, overviewZoom);
        zoomTo(targetZ, { duration: 300 });
    }, [fitBounds, zoomTo, canvasBounds, overviewZoom]);

    // Step Zoom In
    const handleZoomIn = useCallback(() => {
        const presets = PRESET_ZOOM_PERCENTAGES.map(p => p.value);
        const next = presets.find(p => p > currentPercentage + 2);
        if (next !== undefined) {
            applyPercentage(next);
        } else {
            applyPercentage(Math.min(300, currentPercentage + 25));
        }
    }, [currentPercentage, applyPercentage]);

    // Step Zoom Out
    const handleZoomOut = useCallback(() => {
        const presets = PRESET_ZOOM_PERCENTAGES.map(p => p.value);
        const prevList = presets.filter(p => p < currentPercentage - 2);
        if (prevList.length > 0) {
            const prev = prevList[prevList.length - 1];
            applyPercentage(prev);
        } else {
            applyPercentage(0);
        }
    }, [currentPercentage, applyPercentage]);

    return (
        <Panel position="bottom-left" className={cn("m-3", className)}>
            <div className="flex items-center bg-background/95 dark:bg-slate-900/95 backdrop-blur-md border border-border/80 shadow-md rounded-xl p-1 gap-1 select-none">
                {/* Zoom Out Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={handleZoomOut}
                    disabled={currentPercentage <= 0}
                    title="Zoom out towards full canvas overview"
                >
                    <Minus className="h-3.5 w-3.5" />
                </Button>

                {/* Interactive Percentage Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="flex items-center gap-1 h-7 px-2 text-xs font-semibold rounded-lg hover:bg-muted/80 text-foreground transition-colors min-w-[56px] justify-center tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/40"
                            title="Choose zoom level"
                        >
                            <span>{currentPercentage}%</span>
                            <ChevronDown className="h-3 w-3 text-muted-foreground opacity-70" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="top" className="w-56 p-1 text-xs">
                        <DropdownMenuLabel className="text-[11px] text-muted-foreground font-medium px-2 py-1">
                            Canvas Zoom
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {PRESET_ZOOM_PERCENTAGES.map((preset) => {
                            const isSelected = Math.abs(currentPercentage - preset.value) <= 2;
                            return (
                                <DropdownMenuItem
                                    key={preset.value}
                                    onClick={() => applyPercentage(preset.value)}
                                    className={cn(
                                        "flex items-center justify-between py-1.5 px-2 text-xs cursor-pointer rounded-md",
                                        isSelected && "bg-primary/10 text-primary font-medium"
                                    )}
                                >
                                    <span>{preset.label}</span>
                                    {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Zoom In Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={handleZoomIn}
                    disabled={currentPercentage >= 300}
                    title="Zoom in"
                >
                    <Plus className="h-3.5 w-3.5" />
                </Button>

                {/* Divider */}
                <div className="w-[1px] h-4 bg-border/60 mx-0.5" />

                {/* Dedicated Full Canvas (0%) Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-7 px-2.5 text-xs gap-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted",
                        currentPercentage === 0 && "bg-primary/10 text-primary font-semibold"
                    )}
                    onClick={() => applyPercentage(0)}
                    title="Cover the full canvas workspace (0%)"
                >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Full</span>
                    <span className="text-[10px] opacity-70">0%</span>
                </Button>

                {/* Dedicated Normal View (100% = 0.70x Scale) Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "h-7 px-2.5 text-xs gap-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted",
                        currentPercentage === 100 && "bg-primary/10 text-primary font-semibold"
                    )}
                    onClick={() => applyPercentage(100)}
                    title="Normal 100% view (0.70x scale - covers well)"
                >
                    <RotateCcw className="h-3 w-3" />
                    <span>Normal</span>
                    <span className="text-[10px] opacity-70">100%</span>
                </Button>
            </div>
        </Panel>
    );
}
