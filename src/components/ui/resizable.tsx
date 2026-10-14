"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import {
  Group,
  Panel,
  Separator,
  type GroupProps,
  type PanelProps,
  type SeparatorProps,
} from "react-resizable-panels";

import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({
  className,
  orientation = "horizontal",
  ...props
}: GroupProps) => (
  <Group
    orientation={orientation}
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
);

const ResizablePanel = Panel;

interface ResizableHandleProps extends SeparatorProps {
  withHandle?: boolean;
}

const ResizableHandle = ({
  withHandle = true,
  className,
  ...props
}: ResizableHandleProps) => (
  <Separator
    className={cn(
      "relative flex w-1.5 hover:w-2 items-center justify-center bg-border/40 hover:bg-primary/40 transition-all focus-visible:outline-none cursor-col-resize select-none z-30",
      className
    )}
    {...props}
  >
    {withHandle ? (
      <div className="z-30 flex h-7 w-3 items-center justify-center rounded-xs border border-border/80 bg-background/95 shadow-xs hover:bg-primary hover:text-primary-foreground transition-colors cursor-col-resize">
        <GripVertical className="h-3 w-3 text-muted-foreground hover:text-inherit" />
      </div>
    ) : (
      <div className="h-8 w-0.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
    )}
  </Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
