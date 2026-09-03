import React from "react";

export function QuillIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M20.5 3.5C18.5 2.5 15 2 12 5C9 8 7 12 5 15L3 21L9 19C12 17 16 15 19 12C22 9 21.5 5.5 20.5 3.5Z"
        fill="#8B4513"
        fillOpacity="0.25"
        stroke="#8B4513"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 21L13 11"
        stroke="#5c2e0b"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M10 8C11.5 8.5 13 8 15 6"
        stroke="#8B4513"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M8 12C9.5 12.5 11.5 12 13.5 10"
        stroke="#8B4513"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="3.2" cy="20.8" r="0.9" fill="#3E2723" />
    </svg>
  );
}

export function QuillLogo() {
  return (
    <div className="flex items-center gap-2 select-none font-sans shrink-0">
      <QuillIcon className="size-5 shrink-0" />
      <span className="font-sans text-sm sm:text-base tracking-tight text-foreground font-semibold flex items-center">
        Quill
        <span className="hidden xl:inline text-xs text-muted-foreground font-normal tracking-normal mx-1">—</span>
        <span className="hidden xl:inline text-xs font-normal text-muted-foreground">offline notes</span>
      </span>
    </div>
  );
}
