import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export type CornerSize = "sm" | "default" | "lg";
export type CornerWeight = "thin" | "normal";

export function Corners({
  className,
  size = "default",
  offset = "border",
  weight = "normal",
  light = false,
}: {
  className?: string;
  size?: CornerSize;
  offset?: "border" | "none";
  weight?: CornerWeight;
  light?: boolean;
}) {
  const sizeClasses = {
    sm: "size-2",
    default: "size-2.5 sm:size-3",
    lg: "size-3 sm:size-3.5",
  }[size];

  const colorClass = light
    ? "border-foreground/30"
    : "border-foreground/45";

  const borderStyles = {
    tl: weight === "thin" ? "border-t border-l" : "border-t-2 border-l-2",
    tr: weight === "thin" ? "border-t border-r" : "border-t-2 border-r-2",
    bl: weight === "thin" ? "border-b border-l" : "border-b-2 border-l-2",
    br: weight === "thin" ? "border-b border-r" : "border-b-2 border-r-2",
  };

  const pos =
    offset === "border"
      ? {
          tl: "-top-px -left-px",
          tr: "-top-px -right-px",
          bl: "-bottom-px -left-px",
          br: "-right-px -bottom-px",
        }
      : {
          tl: "top-0 left-0",
          tr: "top-0 right-0",
          bl: "bottom-0 left-0",
          br: "right-0 bottom-0",
        };

  return (
    <>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute z-10",
          borderStyles.tl,
          pos.tl,
          sizeClasses,
          colorClass,
          className
        )}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute z-10",
          borderStyles.tr,
          pos.tr,
          sizeClasses,
          colorClass,
          className
        )}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute z-10",
          borderStyles.bl,
          pos.bl,
          sizeClasses,
          colorClass,
          className
        )}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute z-10",
          borderStyles.br,
          pos.br,
          sizeClasses,
          colorClass,
          className
        )}
      />
    </>
  );
}

type FrameProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Draw corner L-brackets */
  corners?: boolean;
};

/** Blueprint-style content box with optional corner ticks */
export function Frame({
  children,
  className,
  corners = true,
  ...props
}: FrameProps) {
  return (
    <div
      className={cn(
        "relative border border-border bg-background/90",
        className
      )}
      {...props}
    >
      {corners && <Corners offset="border" />}
      {children}
    </div>
  );
}

type CornerHeadingProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  corners?: boolean;
  size?: CornerSize;
  as?: "div" | "h1" | "h2" | "h3" | "span";
};

/** Blueprint corner frame for titles and headings: lightish, thin 1px corner brackets */
export function CornerHeading({
  children,
  className,
  corners = true,
  size = "default",
  as: Comp = "div",
  ...props
}: CornerHeadingProps) {
  return (
    <Comp
      className={cn(
        "relative inline-block px-3 py-1.5 sm:px-4 sm:py-2",
        className
      )}
      {...props}
    >
      {corners && <Corners size={size} offset="none" weight="thin" light />}
      {children}
    </Comp>
  );
}

/** Small corner-framed badge for category labels and header titles: lightish, thin 1px corner brackets */
export function CornerBadge({
  children,
  className,
  size = "sm",
  as: Comp = "div",
  ...props
}: HTMLAttributes<HTMLDivElement> & { size?: CornerSize; as?: React.ElementType }) {
  return (
    <Comp
      className={cn(
        "relative inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] font-semibold tracking-[0.18em] text-foreground uppercase font-mono",
        className
      )}
      {...props}
    >
      <Corners size={size} offset="none" weight="thin" light />
      {children}
    </Comp>
  );
}

type FrameHeaderProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  label?: string;
};

/** Labeled top bar inside a frame (like Langfuse section titles) */
export function FrameHeader({
  children,
  label,
  className,
  ...props
}: FrameHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6",
        className
      )}
      {...props}
    >
      {label && <CornerBadge>{label}</CornerBadge>}
      {children}
    </div>
  );
}

export function FrameBody({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-4 py-6 sm:px-6 sm:py-8", className)} {...props}>
      {children}
    </div>
  );
}

/** Horizontal rule that spans a frame cell */
export function FrameDivider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}
