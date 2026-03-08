import React, { useState, useRef } from "react";
import { Shield, Code2, Bug, BarChart3, Rocket, Upload, Download, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";

import AppSidebar from "@/components/AppSidebar";
import EditorPane from "@/components/EditorPane";
import IssuesPanel from "@/components/IssuesPanel";
import InsightsPanel from "@/components/InsightsPanel";
import OptimizePanel from "@/components/OptimizePanel";
import { analyzeCode, detectLanguage, exportMarkdown, saveHistory, type AnalysisResults } from "@/services/analysis";

const TABS = [
  { id: 0, label: "Editor", icon: Code2 },
  { id: 1, label: "Results", icon: Bug },
  { id: 2, label: "Insights", icon: BarChart3 },
  { id: 3, label: "Optimize", icon: Rocket },
];

const DEFAULT_CODE = `# Paste or upload your code here
# Or drag & drop a file onto the editor

def process_data(items):
    result = []
    for item in items:
        for other in items:
            if item == other:
                result.append(item)
    return result

x = eval(input("Enter expression: "))
print(x)
`;

export default function CodeSageApp() {
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState(0);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState("python");
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onUpload = (text: string, filename: string) => {
    setCode(text);
    setLanguage(detectLanguage(filename, text));
    toast.success(`Loaded ${filename}`);
  };

  const onReview = async () => {
    if (!code?.trim()) {
      toast.error("Please provide code before review.");
      return;
    }
    setLoading(true);
    try {
      const res = await analyzeCode(code, language);
      setResults(res);
      setTab(1);
      toast.success(`Analysis complete: ${res.summary.totalIssues} issues found`);
      
      // Save to history
      await saveHistory({
        language,
        codeSnippet: code.slice(0, 5000),
        summary: res.summary,
        issues: res.issues,
        timestamp: Date.now(),
      });
    } catch (e) {
      toast.error("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onOptimize = () => {
    if (!code?.trim()) {
      toast.error("No code to optimize");
      return;
    }
    setTab(3);
  };

  const handleCodeDetected = (text: string, lang: string) => {
    setCode(text);
    setLanguage(lang);
    toast.success("Code detected!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUpload(ev.target?.result as string, file.name);
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar language={language} onPickLang={setLanguage} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground tracking-tight">CodeSAGE AI</h1>
                <p className="text-[10px] text-muted-foreground">Intelligent Code Analysis</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>{theme === "dark" ? "Light mode" : "Dark mode"}</TooltipContent>
            </Tooltip>
            {results && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => exportMarkdown(results)}>
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export report as Markdown</TooltipContent>
              </Tooltip>
            )}

            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".js,.ts,.py,.java,.cpp,.go,.jsx,.tsx"
            />
            <Button variant="sage-outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Upload
            </Button>

            <Button variant="sage-outline" size="sm" onClick={onOptimize}>
              <Rocket className="h-4 w-4" />
              Optimize
            </Button>

            <Button variant="sage" size="sm" onClick={onReview} disabled={loading}>
              <Code2 className="h-4 w-4" />
              {loading ? "Analyzing..." : "Review Code"}
            </Button>
          </div>
        </header>

        {/* Loading bar */}
        {loading && (
          <div className="h-0.5 bg-muted overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-secondary animate-shimmer w-full" />
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border bg-card/30">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-all border-b-2",
                  tab === t.id
                    ? "text-primary border-primary bg-primary/5"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/20"
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {tab === 0 && (
                <EditorPane code={code} language={language} onChange={setCode} />
              )}
              {tab === 1 && <IssuesPanel results={results} />}
              {tab === 2 && <InsightsPanel results={results} />}
              {tab === 3 && <OptimizePanel code={code} language={language} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
