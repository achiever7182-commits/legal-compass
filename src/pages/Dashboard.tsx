import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Scale, FileText, TrendingUp, Bot } from "lucide-react";
import { fetchCases } from "@/lib/api";
import PriorityColumn from "@/components/PriorityColumn";
import FileUpload from "@/components/FileUpload";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: cases = [], isLoading, refetch } = useQuery({
    queryKey: ["cases"],
    queryFn: fetchCases,
  });

  const highCases = cases.filter((c) => c.priority === "High");
  const medCases = cases.filter((c) => c.priority === "Medium");
  const lowCases = cases.filter((c) => c.priority === "Low");

  const avgWin = cases.length > 0
    ? Math.round(cases.reduce((s, c) => s + (c.win_probability ?? 0), 0) / cases.length)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Scale className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground tracking-tight">JusticeBridge</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Case Intelligence Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span className="tabular-nums font-medium">{cases.length}</span> cases
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="tabular-nums font-medium">{avgWin}%</span> avg win
            </div>
            <Link
              to="/agent"
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Bot className="h-3.5 w-3.5" />
              AI Agent
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <FileUpload onAnalysisComplete={() => refetch()} />

        {cases.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-3 gap-4"
          >
            {[
              { label: "High Priority", count: highCases.length, colorClass: "bg-priority-high" },
              { label: "Medium Priority", count: medCases.length, colorClass: "bg-priority-medium" },
              { label: "Low Priority", count: lowCases.length, colorClass: "bg-priority-low" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-lg p-4 surface-card">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${stat.colorClass}`} />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                </div>
                <span className="text-2xl font-semibold text-foreground tabular-nums">{stat.count}</span>
              </div>
            ))}
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 w-32 shimmer rounded" />
                <div className="h-24 shimmer rounded-lg" />
                <div className="h-24 shimmer rounded-lg" />
              </div>
            ))}
          </div>
        ) : cases.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">No active cases. Upload a case file to begin analysis.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PriorityColumn priority="High" cases={highCases} color="hsl(0, 84%, 60%)" />
            <PriorityColumn priority="Medium" cases={medCases} color="hsl(35, 92%, 50%)" />
            <PriorityColumn priority="Low" cases={lowCases} color="hsl(142, 71%, 45%)" />
          </div>
        )}
      </main>
    </div>
  );
}
