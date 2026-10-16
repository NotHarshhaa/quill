"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useOverlayLayer } from "@/lib/ui/overlayStack";

export type DrawerWidth = "sm" | "md" | "lg" | "xl";

export interface SideDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accessible title — rendered in the drawer header. */
  title: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  width?: DrawerWidth;
  className?: string;
  bodyClassName?: string;
}

const DRAWER_WIDTH: Record<DrawerWidth, string> = {
  sm: "24rem",
  md: "28rem",
  lg: "40rem",
  xl: "52rem",
};

/**
 * Desktop (≥768px) counterpart of {@link BottomSheet}: the same content slides
 * in from the right. Radix Dialog provides the focus trap, Esc-to-close and
 * outside-click dismissal; the layer is registered so the Android back button
 * (and the app's Esc routing) closes it in order.
 */
export function SideDrawer({
  open,
  onOpenChange,
  title,
  description,
  icon,
  badge,
  headerActions,
  footer,
  children,
  width = "md",
  className,
  bodyClassName,
}: SideDrawerProps) {
  useOverlayLayer(open, () => onOpenChange(false));

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-slot="side-drawer-overlay"
          className="fixed inset-0 z-50 bg-black/30 duration-200 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        />
        <DialogPrimitive.Content
          data-slot="side-drawer-content"
          aria-describedby={undefined}
          style={{ maxWidth: DRAWER_WIDTH[width] }}
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-l border-border/80 bg-background font-sans text-sm shadow-2xl outline-none",
            "data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right duration-200 motion-reduce:animate-none",
            className
          )}
        >
          <div
            className="flex shrink-0 items-center justify-between gap-2 border-b border-border/70 bg-muted/40 px-3 sm:px-4"
            style={{ paddingTop: "var(--safe-top)" }}
          >
            <div className="flex h-12 min-w-0 items-center gap-2">
              {icon}
              <DialogPrimitive.Title className="truncate text-sm font-semibold text-foreground">
                {title}
              </DialogPrimitive.Title>
              {badge}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {headerActions}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className="h-7 w-7 rounded-none text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          </div>

          {description && (
            <DialogPrimitive.Description className="shrink-0 border-b border-border/50 px-4 py-2 text-[11px] leading-relaxed text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
          )}

          <div
            className={cn("min-h-0 flex-1 overflow-y-auto", bodyClassName)}
            style={{ paddingBottom: "var(--safe-bottom)" }}
          >
            {children}
          </div>

          {footer && (
            <div className="shrink-0 border-t border-border/70 px-4 py-3">{footer}</div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
