import React, { useState, useRef, useCallback, useMemo } from "react";
import { Upload, CloudUpload } from "lucide-react";

interface CodeCanvasProps {
  onCodeDetected: (code: string, language: string) => void;
}

function detectLang(filename: string, text: string): string {
  if (filename) {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const map: Record<string, string> = {
      js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
      py: "python", java: "java", cpp: "cpp", cc: "cpp", go: "go",
    };
    if (map[ext]) return map[ext];
  }
  if (text.includes("def ") && text.includes(":")) return "python";
  if (text.includes("public class")) return "java";
  if (text.includes("#include")) return "cpp";
  return "javascript";
}

export default function CodeCanvas({ onCodeDetected }: CodeCanvasProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text/plain");
    if (text.trim()) {
      setIsProcessing(true);
      setTimeout(() => {
        onCodeDetected(text, detectLang("", text));
        setIsProcessing(false);
      }, 300);
    }
  }, [onCodeDetected]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const text = await file.text();
      onCodeDetected(text, detectLang(file.name, text));
    } finally {
      setIsProcessing(false);
    }
  }, [onCodeDetected]);

  const badges = ["JavaScript", "Python", "TypeScript", "Java", "C++", "Go"];

  return (
    <div
      ref={ref}
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      tabIndex={0}
      className="relative flex flex-col items-center justify-center min-h-[500px] rounded-xl border-2 border-dashed border-border/50 bg-card/30 cursor-pointer transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary/50 overflow-hidden"
    >
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-secondary/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
      </div>

      {!isProcessing ? (
        <div className="relative z-10 flex flex-col items-center gap-6 p-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-float">
              <CloudUpload className="h-10 w-10 text-primary" />
            </div>
            <div className="absolute inset-0 w-20 h-20 rounded-2xl bg-primary/5 animate-ping" style={{ animationDuration: "3s" }} />
          </div>

          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground mb-1">Drop Your Code Here</h3>
            <p className="text-muted-foreground">
              or <span className="text-primary font-medium">paste</span> it directly
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {badges.map((b) => (
              <span
                key={b}
                className="text-xs px-2.5 py-1 rounded-full border border-border/50 bg-muted/30 text-muted-foreground"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Processing your code...</p>
        </div>
      )}

      {isDragging && (
        <div className="absolute inset-0 z-20 bg-primary/10 backdrop-blur-sm flex items-center justify-center border-2 border-primary rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-12 w-12 text-primary" />
            <p className="text-primary font-bold text-lg">Release to analyze</p>
          </div>
        </div>
      )}
    </div>
  );
}
