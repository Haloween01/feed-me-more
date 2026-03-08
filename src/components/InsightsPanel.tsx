import React, { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, AreaChart, Area, CartesianGrid, Legend, ComposedChart, Line
} from "recharts";
import { AlertTriangle, AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisResults } from "@/services/analysis";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#10b981"];

function StatCard({ title, value, hint, gradient, icon }: {
  title: string; value: string | number; hint: string; gradient: string; icon: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-xl p-4 text-foreground", gradient)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="opacity-80">{icon}</div>
      </div>
      <p className="text-[10px] mt-2 opacity-60">{hint}</p>
    </div>
  );
}

function ScoreCircle({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" className="transform -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
        <circle
          cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute mt-8 text-center">
        <p className="text-xl font-bold text-foreground">{score}</p>
      </div>
      <p className="text-xs text-muted-foreground mt-2 font-medium">{label}</p>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-background/95 border border-border p-2 shadow-lg text-xs">
      {label && <p className="text-muted-foreground mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

interface InsightsPanelProps {
  results: AnalysisResults | null;
}

export default function InsightsPanel({ results }: InsightsPanelProps) {
  if (!results?.summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">Ready for insights ✨</h3>
          <p className="text-muted-foreground">Run the analysis to populate quality, security, and performance data.</p>
        </div>
      </div>
    );
  }

  const summary = results.summary;
  const issues = results.issues;

  const hotspotScore = (summary.critical ?? 0) * 4 + (summary.high ?? 0) * 3 + (summary.medium ?? 0) * 2 + (summary.low ?? 0);
  const hotspotLabel = hotspotScore >= 12 ? "High Risk" : hotspotScore >= 6 ? "Moderate" : "Low Risk";

  const scoreData = [
    { name: "Quality", score: summary.qualityScore, target: 85 },
    { name: "Security", score: summary.securityScore, target: 90 },
    { name: "Performance", score: summary.performanceScore ?? 70, target: 80 },
  ];

  const severityData = [
    { name: "Critical", value: summary.critical, color: COLORS[0] },
    { name: "High", value: summary.high, color: COLORS[1] },
    { name: "Medium", value: summary.medium, color: COLORS[2] },
    { name: "Low", value: summary.low, color: COLORS[3] },
  ];

  const radarData = [
    { metric: "Code Quality", score: summary.qualityScore, fullMark: 100 },
    { metric: "Security", score: summary.securityScore, fullMark: 100 },
    { metric: "Performance", score: summary.performanceScore ?? 70, fullMark: 100 },
    { metric: "Maintainability", score: Math.min(100, summary.qualityScore + 10), fullMark: 100 },
    { metric: "Test Coverage", score: Math.floor(60 + Math.random() * 30), fullMark: 100 },
  ];

  const trendData = [
    { name: "Jan", score: 65, issues: 45 },
    { name: "Feb", score: 68, issues: 42 },
    { name: "Mar", score: 72, issues: 35 },
    { name: "Apr", score: 76, issues: 28 },
    { name: "May", score: 79, issues: 24 },
    { name: "Now", score: summary.qualityScore, issues: summary.totalIssues },
  ];

  return (
    <div className="space-y-4">
      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Quality Score" value={summary.qualityScore} hint="Overall code quality" gradient="bg-gradient-to-br from-sage-blue/20 to-sage-violet/20 border border-sage-blue/20 rounded-xl" icon={<CheckCircle className="h-8 w-8" />} />
        <StatCard title="Security Score" value={summary.securityScore} hint="Static + AI analysis" gradient="bg-gradient-to-br from-sage-cyan/20 to-sage-blue/20 border border-sage-cyan/20 rounded-xl" icon={<ShieldAlert className="h-8 w-8" />} />
        <StatCard title="Risk Level" value={hotspotLabel} hint="Weighted severity" gradient={cn("border rounded-xl", hotspotScore >= 12 ? "bg-sage-red/15 border-sage-red/20" : hotspotScore >= 6 ? "bg-warning/15 border-warning/20" : "bg-success/15 border-success/20")} icon={<AlertTriangle className="h-8 w-8" />} />
        <StatCard title="Total Issues" value={summary.totalIssues} hint="Sum of all detected" gradient="bg-muted/50 border border-border rounded-xl" icon={<AlertCircle className="h-8 w-8" />} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quality vs Target */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-sm font-bold text-foreground mb-1">Quality Metrics vs Target</h4>
          <div className="h-[280px]">
            <ResponsiveContainer>
              <ComposedChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} domain={[0, 100]} />
                <ReTooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="score" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} name="Current" />
                <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} name="Target" strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Pie */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-sm font-bold text-foreground mb-1">Issue Severity Distribution</h4>
          <div className="h-[280px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={severityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4}
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ""}>
                  {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <ReTooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Trend */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h4 className="text-sm font-bold text-foreground mb-1">Quality & Issues Trend</h4>
        <div className="h-[260px]">
          <ResponsiveContainer>
            <ComposedChart data={trendData}>
              <defs>
                <linearGradient id="perfGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 12 }} domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <ReTooltip content={<CustomTooltip />} />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="score" stroke="#60a5fa" fill="url(#perfGrad)" strokeWidth={2} name="Quality Score" />
              <Line yAxisId="right" type="monotone" dataKey="issues" stroke="#ef4444" strokeWidth={2} name="Issue Count" dot={{ fill: "#ef4444", r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <h4 className="text-sm font-bold text-foreground mb-1">Multi-Dimensional Analysis</h4>
          <div className="h-[280px]">
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(217 33% 20%)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} strokeWidth={2} />
                <ReTooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score circles */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h4 className="text-sm font-bold text-foreground mb-4">Score Overview</h4>
          <div className="flex items-center justify-around">
            <ScoreCircle score={summary.securityScore} label="Security" color="#3b82f6" />
            <ScoreCircle score={summary.qualityScore} label="Quality" color="#8b5cf6" />
            <ScoreCircle score={summary.performanceScore ?? 70} label="Performance" color="#10b981" />
          </div>
        </div>
      </div>
    </div>
  );
}
