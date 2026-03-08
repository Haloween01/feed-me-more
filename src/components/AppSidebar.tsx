import React, { useState } from "react";
import {
  Shield, Code2, Terminal, Coffee, Braces,
  CheckCircle, ChevronLeft, ChevronRight, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const LANGS = [
  { id: "python", label: "Python", icon: Terminal, emoji: "🐍" },
  { id: "javascript", label: "JavaScript", icon: Braces, emoji: "⚡" },
  { id: "java", label: "Java", icon: Coffee, emoji: "☕" },
  { id: "cpp", label: "C++", icon: Code2, emoji: "⚙️" },
];

const SERVICES = [
  { name: "Syntax", local: true, ai: true },
  { name: "Style", local: true, ai: true },
  { name: "Security", local: true, ai: true },
  { name: "Quality", local: false, ai: true },
  { name: "Rule", local: true, ai: false },
  { name: "Report", local: true, ai: false },
];

interface AppSidebarProps {
  language: string;
  onPickLang: (lang: string) => void;
}

export default function AppSidebar({ language, onPickLang }: AppSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className={cn(
        "h-full border-r border-border bg-sidebar flex flex-col transition-all duration-300 ease-in-out",
        isOpen ? "w-[250px] min-w-[250px]" : "w-14 min-w-14"
      )}
    >
      {/* Toggle */}
      <div className={cn("flex items-center p-2", isOpen ? "justify-end" : "justify-center")}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{isOpen ? "Collapse" : "Expand"}</TooltipContent>
        </Tooltip>
      </div>

      {isOpen && (
        <div className="flex-1 px-3 pb-3 overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Language
            </span>
          </div>

          {/* Languages */}
          <div className="space-y-1">
            {LANGS.map((l) => (
              <button
                key={l.id}
                onClick={() => onPickLang(l.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  l.id === language
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <span className="text-lg">{l.emoji}</span>
                <div className="text-left">
                  <div className="font-semibold">{l.label}</div>
                  <div className="text-[11px] opacity-60">{l.id}</div>
                </div>
                {l.id === language && (
                  <CheckCircle className="h-3.5 w-3.5 ml-auto text-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-border my-4" />

          {/* Services */}
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Services
            </span>
          </div>

          <div className="space-y-1.5">
            {SERVICES.map((svc) => (
              <div
                key={svc.name}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-border/50 bg-background/30"
              >
                <span className="text-sm font-medium text-foreground/80">{svc.name}</span>
                <div className="flex gap-1">
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-medium",
                      svc.local
                        ? "bg-success/15 text-success"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    Local
                  </span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-medium",
                      svc.ai
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    AI
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div className="mt-4 px-3 py-2 rounded-lg bg-muted/50 border border-border/30">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              💡 Switch languages anytime. Analysis adapts to your selection.
            </p>
          </div>
        </div>
      )}

      {/* Collapsed icons */}
      {!isOpen && (
        <div className="flex flex-col items-center gap-2 px-1 pb-3">
          {LANGS.map((l) => (
            <Tooltip key={l.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onPickLang(l.id)}
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all",
                    l.id === language
                      ? "bg-primary/15 ring-1 ring-primary/30"
                      : "hover:bg-sidebar-accent"
                  )}
                >
                  {l.emoji}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{l.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  );
}
