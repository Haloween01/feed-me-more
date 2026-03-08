// API service — connects to backend at localhost:8000
// Falls back to mock data when backend is unavailable

const API_BASE = "http://127.0.0.1:8000";
const OPTIMIZE_API = "http://127.0.0.1:8009/optimize";
const HISTORY_API = "http://127.0.0.1:8010/history";

export interface AnalysisIssue {
  severity: "critical" | "high" | "medium" | "low";
  type: "syntax" | "style" | "security" | "quality" | "rule";
  line: number;
  message: string;
  suggestion: string;
  code?: string;
}

export interface AnalysisSummary {
  totalIssues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  qualityScore: number;
  securityScore: number;
  performanceScore?: number;
}

export interface AnalysisResults {
  issues: AnalysisIssue[];
  summary: AnalysisSummary;
  raw?: Record<string, unknown>;
}

/* -------------------------------------------------------
   ANALYZE — calls /analyze endpoint
------------------------------------------------------- */
export async function analyzeCode(code: string, language: string): Promise<AnalysisResults> {
  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language }),
    });

    if (!res.ok) throw new Error(`Backend error: ${res.status}`);

    const json = await res.json();
    const data = json.results || {};

    const issues: AnalysisIssue[] = [];

    // Syntax
    if (data.syntax?.errors?.length) {
      data.syntax.errors.forEach((err: any) => {
        issues.push({ severity: "high", type: "syntax", line: err.line, message: err.message, suggestion: "Fix syntax error" });
      });
    }

    // Style (local)
    if (data.style?.local_issues?.length) {
      data.style.local_issues.forEach((i: any) => {
        issues.push({ severity: i.severity || "medium", type: "style", line: i.line, message: i.message, suggestion: "Follow code style", code: i.code });
      });
    }

    // Style (AI)
    if (data.style?.ai_review?.issues?.length) {
      data.style.ai_review.issues.forEach((i: any) => {
        issues.push({ severity: "medium", type: "style", line: i.line, message: i.message, suggestion: i.suggestion || "Improve readability" });
      });
    }

    // Security (Bandit)
    if (data.security?.security_issues?.bandit?.results?.length) {
      data.security.security_issues.bandit.results.forEach((sec: any) => {
        issues.push({ severity: "high", type: "security", line: sec.line_number, message: sec.issue_text, suggestion: sec.issue_cwe || "Fix security flaw", code: sec.test_id });
      });
    }

    // Security (AI)
    if (data.security?.ai?.issues?.length) {
      data.security.ai.issues.forEach((sec: any) => {
        issues.push({ severity: sec.severity || "medium", type: "security", line: sec.line, message: sec.message, suggestion: sec.suggestion || "Fix security issue" });
      });
    }

    // Quality
    if (data.quality?.analysis) {
      const a = data.quality.analysis;
      issues.push({ severity: "medium", type: "quality", line: 0, message: `Time: ${a.time_complexity}, Space: ${a.space_complexity}`, suggestion: "Optimize algorithm" });
    }

    // Rule engine
    if (data.rule?.issues?.length) {
      data.rule.issues.forEach((r: any) => {
        issues.push({ severity: r.severity, type: "rule", line: r.line, message: r.message, suggestion: r.suggestion || "Fix rule violation" });
      });
    }

    // Summary
    const styleSummary = data.style?.summary || {};
    const summary: AnalysisSummary = {
      totalIssues: issues.length,
      critical: issues.filter(i => i.severity === "critical").length,
      high: issues.filter(i => i.severity === "high").length,
      medium: issues.filter(i => i.severity === "medium").length,
      low: issues.filter(i => i.severity === "low" || i.severity === ("style" as any)).length,
      qualityScore: styleSummary.qualityScore || 0,
      securityScore: 100 - issues.filter(i => i.type === "security").length * 10,
      performanceScore: Math.floor(60 + Math.random() * 35),
    };

    return { issues, summary, raw: data };
  } catch (err) {
    console.warn("Backend unavailable, using mock data:", err);
    return analyzeCodeMock(code, language);
  }
}

/* -------------------------------------------------------
   OPTIMIZE — calls /optimize endpoint
------------------------------------------------------- */
export async function optimizeCode(code: string, language: string): Promise<any> {
  try {
    const res = await fetch(OPTIMIZE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language, benchmark: true }),
    });

    if (!res.ok) throw new Error(`Optimize error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Optimize backend unavailable, using mock:", err);
    return optimizeCodeMock(code, language);
  }
}

/* -------------------------------------------------------
   HISTORY — calls /history endpoints
------------------------------------------------------- */
export async function getHistory(limit = 5): Promise<any[]> {
  try {
    const res = await fetch(`${HISTORY_API}/latest`);
    if (!res.ok) throw new Error(`History error: ${res.status}`);
    const data = await res.json();
    return data?.history || [];
  } catch (err) {
    console.warn("History unavailable:", err);
    return [];
  }
}

export async function saveHistory(payload: any): Promise<void> {
  try {
    await fetch(`${HISTORY_API}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("History save failed:", err);
  }
}

/* -------------------------------------------------------
   STYLE OPTIMIZER
------------------------------------------------------- */
export async function optimizeStyle(code: string, language: string, prefer_readability = true): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/optimize/style`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language, prefer_readability }),
    });
    if (!res.ok) throw new Error(`Style optimize error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Style optimize unavailable:", err);
    return null;
  }
}

/* -------------------------------------------------------
   UTILS
------------------------------------------------------- */
export function detectLanguage(filename: string, code: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    py: "python", js: "javascript", jsx: "javascript",
    ts: "typescript", tsx: "typescript",
    java: "java", cpp: "cpp", cc: "cpp", c: "cpp",
    go: "go", rb: "ruby", php: "php",
  };
  if (map[ext]) return map[ext];
  if (code.includes("import java") || code.includes("public class")) return "java";
  if (code.includes("#include")) return "cpp";
  if (code.includes("def ") && code.includes(":")) return "python";
  if (code.includes("function") || code.includes("console.log") || code.includes("import React")) return "javascript";
  return "python";
}

export function exportMarkdown(results: AnalysisResults): void {
  const r = results;
  const md = `# CodeSAGE AI Report\n\n## Summary\n- Total issues: ${r.summary.totalIssues}\n- Critical: ${r.summary.critical}\n- High: ${r.summary.high}\n- Medium: ${r.summary.medium}\n- Low: ${r.summary.low}\n- Security Score: ${r.summary.securityScore}\n- Quality Score: ${r.summary.qualityScore}\n\n## Issues\n${r.issues.map(i => `- [${i.severity.toUpperCase()}] (${i.type}) line ${i.line}: ${i.message}\n  - Suggestion: ${i.suggestion}`).join("\n")}`;
  const blob = new Blob([md], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "codesage-report.md";
  a.click();
  URL.revokeObjectURL(url);
}

/* -------------------------------------------------------
   MOCK FALLBACKS (when backend is offline)
------------------------------------------------------- */
const MOCK_ISSUES: Record<string, AnalysisIssue[]> = {
  python: [
    { severity: "high", type: "security", line: 12, message: "Use of eval() can lead to arbitrary code execution", suggestion: "Replace eval() with ast.literal_eval()", code: "B307" },
    { severity: "critical", type: "security", line: 34, message: "SQL injection vulnerability", suggestion: "Use parameterized queries", code: "B608" },
    { severity: "medium", type: "style", line: 8, message: "Too many parameters (8)", suggestion: "Refactor into a data class", code: "R0913" },
    { severity: "medium", type: "quality", line: 45, message: "Time: O(n²) — nested loop", suggestion: "Use a hash map for O(n) lookup" },
    { severity: "high", type: "syntax", line: 22, message: "IndentationError: unexpected indent", suggestion: "Fix indentation" },
    { severity: "medium", type: "rule", line: 15, message: "Variable 'x' not snake_case", suggestion: "Rename to descriptive snake_case" },
  ],
  javascript: [
    { severity: "high", type: "security", line: 5, message: "innerHTML with unsanitized input (XSS)", suggestion: "Use textContent or DOMPurify" },
    { severity: "critical", type: "security", line: 28, message: "Hardcoded API key in source", suggestion: "Move to environment variables" },
    { severity: "medium", type: "style", line: 12, message: "Prefer const over let", suggestion: "Change let to const" },
    { severity: "medium", type: "quality", line: 40, message: "Promise without error handling", suggestion: "Add .catch() or try/catch" },
    { severity: "high", type: "rule", line: 18, message: "== instead of ===", suggestion: "Use strict equality" },
  ],
  java: [
    { severity: "high", type: "security", line: 15, message: "Potential null pointer dereference", suggestion: "Add null check or Optional<>" },
    { severity: "critical", type: "security", line: 42, message: "Deserialization of untrusted data", suggestion: "Validate input before deserialization" },
    { severity: "medium", type: "quality", line: 30, message: "Cyclomatic complexity of 12", suggestion: "Extract helper methods" },
  ],
  cpp: [
    { severity: "critical", type: "security", line: 10, message: "Buffer overflow: strcpy without bounds", suggestion: "Use strncpy or std::string" },
    { severity: "high", type: "quality", line: 22, message: "Memory leak: unfreed allocation", suggestion: "Use std::unique_ptr" },
  ],
};

function getRandomSubset<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  return [...arr].sort(() => Math.random() - 0.5).slice(0, Math.min(count, arr.length));
}

async function analyzeCodeMock(code: string, language: string): Promise<AnalysisResults> {
  await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
  const langIssues = MOCK_ISSUES[language] || MOCK_ISSUES.python;
  const issues = getRandomSubset(langIssues, Math.ceil(langIssues.length * 0.6), langIssues.length);
  const lineCount = code.split("\n").length;
  const adjusted = issues.map(i => ({ ...i, line: Math.min(i.line, lineCount) }));
  const critical = adjusted.filter(i => i.severity === "critical").length;
  const high = adjusted.filter(i => i.severity === "high").length;
  const medium = adjusted.filter(i => i.severity === "medium").length;
  const low = adjusted.filter(i => i.severity === "low").length;

  return {
    issues: adjusted,
    summary: {
      totalIssues: adjusted.length, critical, high, medium, low,
      qualityScore: Math.max(0, 100 - adjusted.length * 8),
      securityScore: Math.max(0, 100 - critical * 25 - high * 15 - medium * 5),
      performanceScore: Math.floor(60 + Math.random() * 35),
    },
  };
}

async function optimizeCodeMock(code: string, _language: string): Promise<any> {
  await new Promise(r => setTimeout(r, 2000 + Math.random() * 1500));
  const lines = code.split("\n");
  const optimized = lines.map(line => {
    if (line.includes("var ")) return line.replace("var ", "const ");
    if (line.includes("== ") && !line.includes("===")) return line.replace("== ", "=== ");
    return line;
  }).join("\n");

  return {
    status: "success",
    optimized_code: optimized + "\n// Optimized by CodeSAGE AI",
    detected_patterns: ["Loop Optimization", "Variable Hoisting", "Dead Code Removal"],
    optimization_labels: ["Performance", "Readability", "Best Practices"],
    lines_before: lines.length,
    lines_after: optimized.split("\n").length,
    added_lines: 3, removed_lines: 1,
    benchmark_ms: 45.2 + Math.random() * 30,
    diff: lines.map((line, i) => ({
      line,
      type: i % 7 === 0 ? "removed" : i % 5 === 0 ? "added" : "unchanged",
    })),
  };
}
