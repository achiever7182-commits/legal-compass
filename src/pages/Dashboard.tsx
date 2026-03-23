import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, FileText, AlertTriangle, Scale, TrendingUp } from "lucide-react";
import { fetchCases } from "@/lib/api";
import FileUpload from "@/components/FileUpload";
import CaseTable from "@/components/CaseTable";
import Layout from "@/components/Layout";

export default function Dashboard() {
  const { data: cases = [], isLoading, refetch } = useQuery({
    queryKey: ["cases"],
    queryFn: fetchCases,
  });

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let result = [...cases];
    if (priorityFilter !== "all") {
      result = result.filter((c) => c.priority === priorityFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.summary?.toLowerCase().includes(q)) ||
          (c.case_type?.toLowerCase().includes(q))
      );
    }
    // Sort by win_probability (risk score) DESC
    result.sort((a, b) => (b.win_probability ?? 0) - (a.win_probability ?? 0));
    return result;
  }, [cases, search, priorityFilter]);

  const highCount = cases.filter((c) => c.priority === "High").length;
  const medCount = cases.filter((c) => c.priority === "Medium").length;
  const lowCount = cases.filter((c) => c.priority === "Low").length;
  const avgRisk = cases.length > 0
    ? Math.round(cases.reduce((s, c) => s + (c.win_probability ?? 0), 0) / cases.length)
    : 0;

  return (
    <Layout>
      <div className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
        {/* Page header */}
        <div>
          <h1 className="text-heading-lg text-foreground">Prioritized Cases</h1>
          <p className="text-body text-muted-foreground mt-1">Triage Engine Output — AI-analyzed case queue sorted by risk score</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Cases", value: cases.length, icon: FileText, color: "text-primary" },
            { label: "High Priority", value: highCount, icon: AlertTriangle, color: "text-destructive" },
            { label: "Pending Review", value: medCount + lowCount, icon: Scale, color: "text-warning" },
            { label: "Avg Risk Score", value: avgRisk, icon: TrendingUp, color: "text-primary" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-lg border border-border p-5 surface-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-small text-muted-foreground font-medium">{stat.label}</span>
                <stat.icon className={`h-5 w-5 ${stat.color} opacity-60`} />
              </div>
              <span className="text-heading font-semibold text-foreground tabular-nums">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* File upload - Case Intake */}
        <div className="bg-card rounded-lg border border-border p-6 surface-card">
          <h2 className="text-subheading text-foreground mb-1">Case Intake</h2>
          <p className="text-small text-muted-foreground mb-4">Submit dispute documents for triage and priority analysis</p>
          <FileUpload onAnalysisComplete={() => refetch()} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cases by title, summary, or type..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
            />
          </div>
          <div className="flex gap-2">
            {["all", "High", "Medium", "Low"].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-4 py-2 text-small font-medium rounded-lg border transition-colors ${
                  priorityFilter === p
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground"
                }`}
              >
                {p === "all" ? "All" : p}
              </button>
            ))}
          </div>
        </div>

        {/* Case table */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 shimmer rounded-lg" />
            ))}
          </div>
        ) : (
          <CaseTable cases={filtered} />
        )}
      </div>
    </Layout>
  );
}
