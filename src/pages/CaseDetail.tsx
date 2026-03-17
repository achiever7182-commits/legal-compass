import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Scale, Shield, BookOpen, TrendingUp, Calendar, Trash2, Bot, FileEdit } from "lucide-react";
import { motion } from "framer-motion";
import { fetchCaseById, fetchEvidenceByCaseId, deleteCase } from "@/lib/api";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

function getPriorityClass(priority: string | null) {
  switch (priority) {
    case "High": return "priority-high";
    case "Medium": return "priority-medium";
    case "Low": return "priority-low";
    default: return "priority-low";
  }
}

function getStrengthColor(strength: string | null) {
  switch (strength) {
    case "Strong": return "hsl(142, 71%, 45%)";
    case "Medium": return "hsl(35, 92%, 50%)";
    case "Weak": return "hsl(0, 84%, 60%)";
    default: return "hsl(215, 16%, 47%)";
  }
}

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: caseData, isLoading: caseLoading } = useQuery({
    queryKey: ["case", id],
    queryFn: () => fetchCaseById(id!),
    enabled: !!id,
  });

  const { data: evidence = [] } = useQuery({
    queryKey: ["evidence", id],
    queryFn: () => fetchEvidenceByCaseId(id!),
    enabled: !!id,
  });

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteCase(id);
      toast.success("Case deleted");
      navigate("/");
    } catch {
      toast.error("Failed to delete case");
    }
  };

  if (caseLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="shimmer w-64 h-8 rounded" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Case not found</p>
      </div>
    );
  }

  const timeline = Array.isArray(caseData.timeline) ? (caseData.timeline as Array<{ date: string; event: string }>) : [];
  const laws = Array.isArray(caseData.relevant_laws) ? (caseData.relevant_laws as string[]) : [];

  const evidenceChartData = evidence.map((e) => ({
    name: e.description.slice(0, 30) + (e.description.length > 30 ? "…" : ""),
    value: e.strength === "Strong" ? 3 : e.strength === "Medium" ? 2 : 1,
    strength: e.strength,
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <button onClick={handleDelete} className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors">
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="max-w-7xl mx-auto px-6 py-6 space-y-6"
      >
        {/* Title section */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${getPriorityClass(caseData.priority)}`}>
                {caseData.priority}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{caseData.case_type}</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">{caseData.title}</h1>
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold text-foreground tabular-nums">{caseData.win_probability}%</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Probability</div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-card rounded-lg p-5 surface-card">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">Case Summary</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{caseData.summary}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Legal Strategy */}
          <div className="bg-card rounded-lg p-5 surface-card">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">Legal Strategy</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{caseData.legal_strategy}</p>
          </div>

          {/* Relevant Laws */}
          <div className="bg-card rounded-lg p-5 surface-card">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">Relevant Laws</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {laws.map((law, i) => (
                <span key={i} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-sm">
                  {law}
                </span>
              ))}
              {laws.length === 0 && <p className="text-xs text-muted-foreground">No relevant laws identified</p>}
            </div>
          </div>

          {/* Evidence */}
          <div className="bg-card rounded-lg p-5 surface-card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">Key Evidence</h2>
            </div>
            {evidence.length > 0 ? (
              <div className="space-y-2">
                {evidence.map((e) => (
                  <div key={e.id} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: getStrengthColor(e.strength) }} />
                    <div className="flex-1">
                      <p className="text-foreground text-xs">{e.description}</p>
                      <span className="text-[10px] text-muted-foreground">{e.strength}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No evidence extracted</p>
            )}
          </div>

          {/* Evidence Strength Chart */}
          {evidenceChartData.length > 0 && (
            <div className="bg-card rounded-lg p-5 surface-card">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Evidence Strength</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={evidenceChartData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis type="number" domain={[0, 3]} hide />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: "hsl(215, 16%, 47%)" }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                    {evidenceChartData.map((entry, index) => (
                      <Cell key={index} fill={getStrengthColor(entry.strength)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Timeline */}
        {timeline.length > 0 && (
          <div className="bg-card rounded-lg p-5 surface-card">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">Case Timeline</h2>
            </div>
            <div className="relative pl-6">
              <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />
              <div className="space-y-4">
                {timeline.map((item, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-4 top-1 w-2 h-2 rounded-full bg-primary border-2 border-card" />
                    <div className="text-[10px] text-muted-foreground tabular-nums font-medium">{item.date}</div>
                    <div className="text-xs text-foreground mt-0.5">{item.event}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.main>
    </div>
  );
}
