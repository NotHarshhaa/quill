"use client";

import React, { useState } from "react";
import { NOTE_TEMPLATES, NoteTemplate } from "@/lib/templates/noteTemplates";
import { Corners } from "@/components/frame";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Sun, Compass, Calendar, FileText, Check, Sparkles, X } from "lucide-react";

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] sm:max-w-3xl h-[75vh] flex flex-col p-0 gap-0 border border-border bg-background shadow-2xl rounded-none font-sans overflow-hidden"
      >
        <Corners size="sm" offset="border" weight="thin" light />

        {/* Dialog Header */}
        <div className="h-12 px-3 sm:px-5 border-b border-border flex items-center justify-between bg-muted/40 select-none shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="size-4 text-primary shrink-0" />
            <DialogTitle className="text-sm font-semibold text-foreground font-sans truncate">
              Choose Note Template
            </DialogTitle>
            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0.5 border border-border rounded-none shrink-0">
              {NOTE_TEMPLATES.length} TEMPLATES
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="xs"
              variant="default"
              onClick={handleApply}
              className="gap-1.5 font-sans rounded-none h-7 px-3 text-xs"
            >
              <Check className="size-3" />
              <span>Use Template</span>
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={onClose}
              className="h-7 w-7 rounded-none text-muted-foreground hover:text-foreground"
              aria-label="Close dialog"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Template List & Preview Split */}
        <div className="flex-1 flex min-h-0">
          {/* List (Left) */}
          <div className="w-60 sm:w-72 border-r border-border/70 overflow-y-auto bg-muted/20 select-none p-2 space-y-1.5 shrink-0">
            {NOTE_TEMPLATES.map((tmpl) => {
              const isSelected = tmpl.id === selectedId;
              const IconComp = ICON_MAP[tmpl.iconName] || FileText;

              return (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedId(tmpl.id)}
                  className={`relative w-full text-left p-3 transition-colors border ${
                    isSelected
                      ? "bg-card border-border shadow-xs text-foreground"
                      : "bg-transparent border-transparent hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {isSelected && <Corners size="sm" offset="border" weight="thin" light />}
                  <div className="flex items-center gap-2">
                    <IconComp className={`size-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs font-semibold text-foreground">{tmpl.title}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2 font-sans">
                    {tmpl.description}
                  </p>
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {tmpl.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-mono text-muted-foreground/70 bg-muted/50 px-1 py-0.2 border border-border/40"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Preview (Right) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {selectedTemplate.content}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
