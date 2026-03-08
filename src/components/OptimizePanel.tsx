import React, { useState } from "react";
import { Rocket, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { optimizeCode } from "@/services/analysis";

interface OptimizePanelProps {
  code: string;
  language: string;
}

export default function OptimizePanel({ code, language }: OptimizePanelProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("optimized");
  const [copied, setCopied] = useState(false);

  const handleOptimize = async () => {
    if (!code?.trim()) {
      setError("No code found in editor.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await optimizeCode(code, language);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Optimization failed");
    } finally {
      setLoading(false);
    }
  };

  const copyOptimized = () => {
    if (data?.optimized_code) {
      navigator.clipboard.writeText(data.optimized_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">AI Code Optimization</h3>
        <Button
          variant="sage"
          size="sm"
          onClick={handleOptimize}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              Run Optimization
            </>
          )}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Status */}
      {data && (
        <div className="rounded-lg bg-success/10 border border-success/30 p-3 text-sm text-success">
          Status: <span className="font-bold">{data.status.toUpperCase()}</span>
          {data.benchmark_ms && <span> · ⏱ {data.benchmark_ms.toFixed(1)}ms</span>}
        </div>
      )}

      {/* Insights */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg bg-card border border-border p-3">
            <p className="text-xs font-bold text-foreground mb-2">🧠 Patterns</p>
            <div className="flex flex-wrap gap-1">
              {data.detected_patterns.map((p: string, i: number) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{p}</span>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-card border border-border p-3">
            <p className="text-xs font-bold text-foreground mb-2">📊 Labels</p>
            <div className="flex flex-wrap gap-1">
              {data.optimization_labels.map((l: string, i: number) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">{l}</span>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-card border border-border p-3">
            <p className="text-xs font-bold text-foreground mb-2">📈 Diff</p>
            <p className="text-sm text-foreground">
              <span className="text-success">+{data.added_lines}</span> / <span className="text-destructive">-{data.removed_lines}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">{data.lines_before} → {data.lines_after} lines</p>
          </div>
        </div>
      )}

      {/* Code viewer */}
      {data && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-border">
            {[
              { id: "optimized", label: "Optimized Code" },
              { id: "original", label: "Original (Diff)" },
              { id: "split", label: "Split View" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium transition-colors border-b-2",
                  activeTab === t.id
                    ? "text-primary border-primary bg-primary/5"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30"
                )}
              >
                {t.label}
              </button>
            ))}

            <div className="ml-auto pr-2">
              <Button variant="ghost" size="sm" onClick={copyOptimized}>
                {copied ? <CheckCircle className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {activeTab === "optimized" && (
              <pre className="text-sm font-mono text-foreground/90 whitespace-pre-wrap leading-6 max-h-[420px] overflow-auto">
                {data.optimized_code}
              </pre>
            )}

            {activeTab === "original" && (
              <pre className="text-sm font-mono whitespace-pre-wrap leading-6 max-h-[420px] overflow-auto">
                {data.diff.map((d: any, i: number) => (
                  <div
                    key={i}
                    className={cn(
                      "px-2",
                      d.type === "added" && "bg-success/15",
                      d.type === "removed" && "bg-destructive/15"
                    )}
                  >
                    {d.line}
                  </div>
                ))}
              </pre>
            )}

            {activeTab === "split" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-foreground mb-2">Original (Diff)</p>
                  <pre className="text-xs font-mono whitespace-pre-wrap leading-5 max-h-[400px] overflow-auto rounded-lg bg-background/50 p-3 border border-border/30">
                    {data.diff.map((d: any, i: number) => (
                      <div key={i} className={cn(d.type === "added" && "bg-success/15", d.type === "removed" && "bg-destructive/15")}>{d.line}</div>
                    ))}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground mb-2">Optimized</p>
                  <pre className="text-xs font-mono whitespace-pre-wrap leading-5 max-h-[400px] overflow-auto rounded-lg bg-background/50 p-3 border border-border/30">
                    {data.optimized_code}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!data && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <h4 className="text-lg font-bold text-foreground mb-1">Ready to Optimize</h4>
          <p className="text-muted-foreground text-sm max-w-sm">
            Click "Run Optimization" to let AI analyze and improve your code for better performance and readability.
          </p>
        </div>
      )}
    </div>
  );
}
