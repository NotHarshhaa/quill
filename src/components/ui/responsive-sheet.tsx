"use client";

import * as React from "react";

import { BottomSheet, type BottomSheetProps, type SheetSnap } from "@/components/ui/bottom-sheet";
import { SideDrawer, type DrawerWidth } from "@/components/ui/side-drawer";
import { useIsMobileShell } from "@/hooks/useMediaQuery";

export interface ResponsiveSheetProps extends Omit<BottomSheetProps, "snapPoints"> {
  /**
   * Desktop presentation. `drawer` (default) slides in from the right with the
   * same content; `popover` renders `desktopContent` instead, for surfaces that
   * are already anchored popovers on desktop.
   */
  desktop?: "drawer" | "popover";
  /** Rendered on desktop when `desktop === "popover"`. */
  desktopContent?: React.ReactNode;
  drawerWidth?: DrawerWidth;
  snapPoints?: SheetSnap[];
}

/**
 * One content tree, two presentations: a bottom sheet below 768px and a
 * right-side drawer (or an already-positioned popover) above it. Mounting is
 * deferred to the matching variant so the sheet's scroll lock and the drawer's
 * portal never fight each other.
 */
export function ResponsiveSheet({
  desktop = "drawer",
  desktopContent,
  drawerWidth = "md",
  snapPoints,
  ...props
}: ResponsiveSheetProps) {
  const isMobileShell = useIsMobileShell();

  if (!isMobileShell) {
    if (desktop === "popover") return <>{desktopContent}</>;
    return <SideDrawer {...props} width={drawerWidth} />;
  }

  return <BottomSheet {...props} snapPoints={snapPoints} />;
}
