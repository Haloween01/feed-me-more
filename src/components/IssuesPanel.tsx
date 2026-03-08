import React, { useState, useMemo } from "react";
import {
  Code2, Paintbrush, Shield, Zap, Scale, ChevronDown, ChevronUp, Copy,
  AlertTriangle, AlertCircle, CheckCircle, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisResults, AnalysisIssue } from "@/services/analysis";

const icons: Record<string, React.ReactNode> = {
  syntax: <Code2 className="h-4 w-4" />,
  style: <Paintbrush className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  quality: <Zap className="h-4 w-4" />,
  rule: <Scale className="h-4 w-4" />,
};

const severityConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  critical: { color: "text-sage-red", bg: "bg-sage-red/10 border-sage-red/30", icon: <AlertCircle className="h-3.5 w-3.5" /> },
  high: { color: "text-warning", bg: "bg-warning/10 border-warning/30", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  medium: { color: "text-sage-amber", bg: "bg-sage-amber/10 border-sage-amber/30", icon: <Info className="h-3.5 w-3.5" /> },
  low: { color: "text-primary", bg: "bg-primary/10 border-primary/30", icon: <CheckCircle className="h-3.5 w-3.5" /> },
};

const LOW_VALUE_KEYWORDS = ["missing module docstring", "trailing whitespace", "line too long", "blank line", "whitespace"];

function isLowValue(issue: AnalysisIssue): boolean {
  const msg = issue.message.toLowerCase();
  return LOW_VALUE_KEYWORDS.some(k => msg.includes(k));
}

function explainWhy(issue: AnalysisIssue): string {
  const type = issue.type;
  if (type === "security") return issue.severity === "critical" || issue.severity === "high"
    ? "This can expose your application to serious security risks."
    : "It may open smaller security gaps worth fixing.";
  if (type === "syntax") return "This can stop the program from running.";
  if (type === "quality") return "It can make the code slower or harder to scale.";
  if (type === "style") return "It makes the code harder for others to read and maintain.";
  return "It reduces the overall reliability of the code.";
}

function IssueCard({ issue }: { issue: AnalysisIssue }) {
  const sev = severityConfig[issue.severity] || severityConfig.low;
  return (
    <div className={cn("rounded-lg border p-3 mb-2 transition-all hover:bg-muted/20", sev.bg)}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={sev.color}>{icons[issue.type]}</span>
          <span className="text-sm font-semibold text-foreground">{issue.type.toUpperCase()}</span>
        </div>
        <span className={cn("inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border", sev.bg, sev.color)}>
          {sev.icon} {issue.severity.toUpperCase()}
        </span>
      </div>
      <p className="text-sm text-foreground/90 mb-1">{issue.message}</p>
      <p className="text-xs text-muted-foreground">Line: {issue.line}</p>
      {issue.suggestion && (
        <div className="mt-2 px-3 py-2 rounded-md bg-background/50 border border-border/30">
          <p className="text-[11px] text-muted-foreground mb-0.5">Suggestion</p>
          <p className="text-xs text-foreground/80">{issue.suggestion}</p>
        </div>
      )}
    </div>
  );
}

interface IssuesPanelProps {
  results: AnalysisResults | null;
}

export default function IssuesPanel({ results }: IssuesPanelProps) {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({
    syntax: true, style: true, security: true, quality: true, rule: true, minor: false,
  });
  const [activeTab, setActiveTab] = useState<"summary" | "issues">("summary");

  const issues = results?.issues || [];

  const { keptIssues, minorIssues } = useMemo(() => {
    const kept: AnalysisIssue[] = [];
    const minor: AnalysisIssue[] = [];
    issues.forEach(i => (isLowValue(i) ? minor : kept).push(i));
    return { keptIssues: kept, minorIssues: minor };
  }, [issues]);

  const grouped = useMemo(() => {
    return keptIssues.reduce((acc, issue) => {
      const t = issue.type;
      acc[t] = acc[t] || [];
      acc[t].push(issue);
      return acc;
    }, {} as Record<string, AnalysisIssue[]>);
  }, [keptIssues]);

  const topIssues = useMemo(() => {
    const weights: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return [...keptIssues].sort((a, b) => (weights[b.severity] || 0) - (weights[a.severity] || 0)).slice(0, 5);
  }, [keptIssues]);

  if (!results?.issues) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        No results yet. Run <span className="text-primary font-semibold ml-1">Review Code</span>.
      </div>
    );
  }

  const categories = ["syntax", "style", "security", "quality", "rule"];
  const summary = results.summary;

  const toggle = (key: string) => setOpenMap(m => ({ ...m, [key]: !m[key] }));

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-lg font-bold text-foreground mb-3">Analysis Overview</h3>
        <div className="flex gap-2">
          {(["summary", "issues"] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === t
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-muted-foreground hover:bg-muted/50"
              )}
            >
              {t === "summary" ? "Simple Summary" : "Detailed Issues"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary tab */}
      {activeTab === "summary" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-6">
          <h4 className="text-lg font-bold">Simple Summary</h4>

          {topIssues.length > 0 && (
            <div>
              <h5 className="text-sm font-bold text-foreground mb-3">Key Problems & Fixes (Top {topIssues.length})</h5>
              <div className="space-y-3">
                {topIssues.map((issue, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-background/50 border border-border/30">
                    <p className="text-sm font-bold mb-1">
                      {idx + 1}. {issue.type.toUpperCase()} (Line {issue.line})
                    </p>
                    <p className="text-sm text-foreground/80"><span className="font-semibold">Problem:</span> {issue.message}</p>
                    <p className="text-sm text-foreground/70"><span className="font-semibold">Why:</span> {explainWhy(issue)}</p>
                    <p className="text-sm text-foreground/70"><span className="font-semibold">Fix:</span> {issue.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Issues", value: summary.totalIssues, color: "text-foreground" },
              { label: "Critical", value: summary.critical, color: "text-sage-red" },
              { label: "High", value: summary.high, color: "text-warning" },
              { label: "Medium", value: summary.medium, color: "text-sage-amber" },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-lg bg-background/50 border border-border/30 text-center">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={cn("text-2xl font-bold mt-1", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-background/50 border border-border/30">
              <p className="text-xs text-muted-foreground">Quality Score</p>
              <p className="text-xl font-bold text-primary">{summary.qualityScore}/100</p>
            </div>
            <div className="p-3 rounded-lg bg-background/50 border border-border/30">
              <p className="text-xs text-muted-foreground">Security Score</p>
              <p className="text-xl font-bold text-success">{summary.securityScore}/100</p>
            </div>
          </div>
        </div>
      )}

      {/* Issues tab */}
      {activeTab === "issues" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map(cat => {
            const items = grouped[cat] || [];
            return (
              <div key={cat} className="rounded-xl border border-border bg-card p-4">
                <button
                  onClick={() => toggle(cat)}
                  className="w-full flex items-center justify-between mb-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-primary">{icons[cat]}</span>
                    <span className="text-sm font-bold text-foreground">{cat.toUpperCase()} ({items.length})</span>
                  </div>
                  {openMap[cat] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                {openMap[cat] && (
                  items.length === 0
                    ? <p className="text-sm text-muted-foreground">No {cat} issues found.</p>
                    : items.map((issue, i) => <IssueCard key={i} issue={issue} />)
                )}
              </div>
            );
          })}

          {/* Minor */}
          <div className="md:col-span-2 rounded-xl border border-border bg-card/50 p-4">
            <button onClick={() => toggle("minor")} className="w-full flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Paintbrush className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground">Minor Style Warnings ({minorIssues.length})</span>
                <span className="text-xs text-muted-foreground">(filtered)</span>
              </div>
              {openMap.minor ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {openMap.minor && minorIssues.map((issue, i) => <IssueCard key={i} issue={issue} />)}
          </div>
        </div>
      )}
    </div>
  );
}
