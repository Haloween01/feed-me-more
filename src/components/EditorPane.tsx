import React, { useState, useEffect, useCallback } from "react";
import { Copy, Trash2, AlignLeft } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const languageIcons: Record<string, string> = {
  python: "🐍", javascript: "⚡", typescript: "💙",
  java: "☕", cpp: "⚙️", go: "🐹",
};

interface EditorPaneProps {
  code: string;
  language: string;
  onChange: (code: string) => void;
}

export default function EditorPane({ code, language, onChange }: EditorPaneProps) {
  const [lineCount, setLineCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setLineCount(code ? code.split("\n").length : 0);
    setCharCount(code?.length || 0);
  }, [code]);

  const handleCopy = () => {
    if (code) navigator.clipboard.writeText(code);
  };

  const handleClear = () => onChange("");

  return (
    <div className="flex flex-col h-full rounded-xl border border-border/50 overflow-hidden bg-card/50">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
            <span>{languageIcons[language] || "📝"}</span>
            {language.toUpperCase()}
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{lineCount} lines</span>
            <span className="text-border">•</span>
            <span>{charCount} chars</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Copy className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Copy code</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleClear} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Clear</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex">
          {/* Line numbers */}
          <div className="w-12 flex-shrink-0 bg-muted/10 border-r border-border/30 py-4 px-1 text-right select-none overflow-hidden">
            {code.split("\n").map((_, i) => (
              <div key={i} className="text-[11px] font-mono text-muted-foreground/40 leading-6 pr-2">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            value={code}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 bg-transparent text-foreground font-mono text-sm leading-6 p-4 resize-none outline-none placeholder:text-muted-foreground/30"
            placeholder="// Paste or type your code here..."
            spellCheck={false}
          />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-border/50 bg-muted/10 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Ready
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>UTF-8</span>
          <span className="text-border">|</span>
          <span>Spaces: 2</span>
          <span className="text-border">|</span>
          <span>{language}</span>
        </div>
      </div>
    </div>
  );
}
