"use client";

import React, { useState } from "react";
import { NOTE_TEMPLATES, NoteTemplate } from "@/lib/templates/noteTemplates";
import { Corners } from "@/components/frame";
import { Button } from "@/components/ui/button";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { Users, Sun, Compass, Calendar, FileText, Check, Sparkles } from "lucide-react";

interface TemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: NoteTemplate) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  Sun,
  Compass,
  Calendar,
  FileText,
};

/**
 * Template picker. Bottom sheet on phones and a right-side drawer on desktop,
 * sharing the same list + preview content.
 */
export function TemplateDialog({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplateDialogProps) {
  const [selectedId, setSelectedId] = useState<string>(NOTE_TEMPLATES[0].id);

  const selectedTemplate =
    NOTE_TEMPLATES.find((t) => t.id === selectedId) || NOTE_TEMPLATES[0];

  const handleApply = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
    }
  };

  return (
    <ResponsiveSheet
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title="Choose Note Template"
      icon={<Sparkles className="size-4 shrink-0 text-primary" strokeWidth={1.75} />}
      badge={
        <span className="shrink-0 border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {NOTE_TEMPLATES.length} TEMPLATES
        </span>
      }
      headerActions={
        <Button
          size="xs"
          variant="default"
          onClick={handleApply}
          className="h-7 gap-1.5 rounded-none px-2.5 text-xs font-sans sm:px-3"
        >
          <Check className="size-3" />
          <span className="hidden min-[420px]:inline">Use Template</span>
          <span className="min-[420px]:hidden">Use</span>
        </Button>
      }
      drawerWidth="lg"
      snapPoints={["half", "full"]}
      initialSnap="full"
      bodyClassName="flex min-h-0 flex-col overflow-hidden p-0"
    >
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Template list — horizontal cards on phones, vertical column on desktop */}
        <div className="shrink-0 border-b border-border/70 bg-muted/20 p-2 select-none md:w-72 md:overflow-y-auto md:border-r md:border-b-0">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 md:flex-col md:gap-1.5 md:overflow-visible md:pb-0">
            {NOTE_TEMPLATES.map((tmpl) => {
              const isSelected = tmpl.id === selectedId;
              const IconComp = ICON_MAP[tmpl.iconName] || FileText;

              return (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedId(tmpl.id)}
                  className={`relative w-[13rem] shrink-0 border p-3 text-left transition-colors md:w-full ${
                    isSelected
                      ? "border-border bg-card text-foreground shadow-xs"
                      : "border-transparent bg-transparent text-muted-foreground hover:bg-muted/40"
                  }`}
                >
                  {isSelected && <Corners size="sm" offset="border" weight="thin" light />}
                  <div className="flex items-center gap-2">
                    <IconComp
                      className={`size-4 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="truncate text-xs font-semibold text-foreground">
                      {tmpl.title}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 font-sans text-[11px] text-muted-foreground/80">
                    {tmpl.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    {tmpl.tags.map((tag) => (
                      <span
                        key={tag}
                        className="border border-border/40 bg-muted/50 px-1 py-0.2 font-mono text-[9px] text-muted-foreground/70"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        <div className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap bg-background p-4 font-mono text-xs leading-relaxed text-foreground/90 sm:p-6">
          {selectedTemplate.content}
        </div>
      </div>
    </ResponsiveSheet>
  );
}
