// Mock analysis service — simulates backend analysis
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

const MOCK_ISSUES: Record<string, AnalysisIssue[]> = {
  python: [
    { severity: "high", type: "security", line: 12, message: "Use of eval() can lead to arbitrary code execution", suggestion: "Replace eval() with ast.literal_eval() or a safe parser", code: "B307" },
    { severity: "critical", type: "security", line: 34, message: "SQL injection vulnerability: unsanitized user input in query", suggestion: "Use parameterized queries or an ORM", code: "B608" },
    { severity: "medium", type: "style", line: 8, message: "Function 'process_data' has too many parameters (8)", suggestion: "Refactor into a data class or use **kwargs", code: "R0913" },
    { severity: "low", type: "style", line: 1, message: "Missing module docstring", suggestion: "Add a module-level docstring explaining purpose", code: "C0114" },
    { severity: "medium", type: "quality", line: 45, message: "Time: O(n²), Space: O(n) — nested loop detected", suggestion: "Consider using a hash map for O(n) lookup" },
    { severity: "high", type: "syntax", line: 22, message: "IndentationError: unexpected indent", suggestion: "Fix the indentation to match the block level" },
    { severity: "medium", type: "rule", line: 15, message: "Variable 'x' does not follow snake_case convention", suggestion: "Rename to a descriptive snake_case name" },
    { severity: "low", type: "quality", line: 50, message: "Function complexity is 15 (threshold: 10)", suggestion: "Break down into smaller functions" },
  ],
  javascript: [
    { severity: "high", type: "security", line: 5, message: "innerHTML assignment with unsanitized input (XSS risk)", suggestion: "Use textContent or sanitize with DOMPurify" },
    { severity: "medium", type: "style", line: 12, message: "Prefer const over let for variables that are never reassigned", suggestion: "Change let to const" },
    { severity: "critical", type: "security", line: 28, message: "Hardcoded API key detected in source code", suggestion: "Move to environment variables" },
    { severity: "low", type: "style", line: 3, message: "Unexpected console.log statement", suggestion: "Remove or replace with a proper logger" },
    { severity: "medium", type: "quality", line: 40, message: "Promise chain without error handling", suggestion: "Add .catch() or use try/catch with async/await" },
    { severity: "high", type: "rule", line: 18, message: "== used instead of ===", suggestion: "Use strict equality (===) to avoid type coercion bugs" },
  ],
  java: [
    { severity: "high", type: "security", line: 15, message: "Potential null pointer dereference", suggestion: "Add null check or use Optional<>" },
    { severity: "medium", type: "quality", line: 30, message: "Method has cyclomatic complexity of 12", suggestion: "Extract helper methods to reduce complexity" },
    { severity: "critical", type: "security", line: 42, message: "Deserialization of untrusted data", suggestion: "Validate and sanitize input before deserialization" },
    { severity: "low", type: "style", line: 8, message: "Class name 'dataProcessor' should be PascalCase", suggestion: "Rename to DataProcessor" },
    { severity: "medium", type: "rule", line: 25, message: "Catching generic Exception", suggestion: "Catch specific exception types" },
  ],
  cpp: [
    { severity: "critical", type: "security", line: 10, message: "Buffer overflow: strcpy without bounds checking", suggestion: "Use strncpy or std::string" },
    { severity: "high", type: "quality", line: 22, message: "Memory leak: allocated memory not freed", suggestion: "Use smart pointers (std::unique_ptr)" },
    { severity: "medium", type: "syntax", line: 5, message: "Missing semicolon at end of statement", suggestion: "Add semicolon" },
    { severity: "low", type: "style", line: 1, message: "Header guard missing", suggestion: "Add #pragma once or #ifndef guard" },
  ],
};

function getRandomSubset<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

export async function analyzeCode(code: string, language: string): Promise<AnalysisResults> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

  const langIssues = MOCK_ISSUES[language] || MOCK_ISSUES.python;
  const issues = getRandomSubset(langIssues, Math.ceil(langIssues.length * 0.6), langIssues.length);

  // Adjust line numbers based on code length
  const lineCount = code.split("\n").length;
  const adjustedIssues = issues.map(i => ({
    ...i,
    line: Math.min(i.line, lineCount),
  }));

  const critical = adjustedIssues.filter(i => i.severity === "critical").length;
  const high = adjustedIssues.filter(i => i.severity === "high").length;
  const medium = adjustedIssues.filter(i => i.severity === "medium").length;
  const low = adjustedIssues.filter(i => i.severity === "low").length;

  const securityScore = Math.max(0, 100 - critical * 25 - high * 15 - medium * 5);
  const qualityScore = Math.max(0, 100 - adjustedIssues.length * 8);

  return {
    issues: adjustedIssues,
    summary: {
      totalIssues: adjustedIssues.length,
      critical,
      high,
      medium,
      low,
      qualityScore,
      securityScore,
      performanceScore: Math.floor(60 + Math.random() * 35),
    },
  };
}

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
