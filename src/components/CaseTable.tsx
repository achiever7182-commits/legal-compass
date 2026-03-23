import { useNavigate } from "react-router-dom";
import { ArrowUpDown } from "lucide-react";
import type { Case } from "@/lib/api";

function getPriorityLabel(priority: string | null): string {
  switch (priority) {
    case "High": return "HIGH";
    case "Medium": return "MEDIUM";
    case "Low": return "LOW";
    default: return "UNRATED";
  }
}

function getPriorityBadgeClass(priority: string | null): string {
  switch (priority) {
    case "High": return "bg-destructive/10 text-destructive";
    case "Medium": return "bg-warning/10 text-warning";
    case "Low": return "bg-success/10 text-success";
    default: return "bg-muted text-muted-foreground";
  }
}

function getResolutionPath(winProbability: number | null): string {
  if (!winProbability) return "REVIEW";
  if (winProbability >= 70) return "COURT";
  if (winProbability >= 40) return "MEDIATION";
  return "ODR";
}

function getResolutionClass(path: string): string {
  switch (path) {
    case "COURT": return "bg-primary/10 text-primary";
    case "MEDIATION": return "bg-warning/10 text-warning";
    case "ODR": return "bg-success/10 text-success";
    default: return "bg-muted text-muted-foreground";
  }
}

interface CaseTableProps {
  cases: Case[];
}

export default function CaseTable({ cases }: CaseTableProps) {
  const navigate = useNavigate();

  if (cases.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-12 text-center">
        <p className="text-muted-foreground">No cases match your criteria. Submit a dispute for triage to begin.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left px-4 py-3 text-small font-semibold text-muted-foreground uppercase tracking-wider">Case ID</th>
            <th className="text-left px-4 py-3 text-small font-semibold text-muted-foreground uppercase tracking-wider">Title / Description</th>
            <th className="text-center px-4 py-3 text-small font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="inline-flex items-center gap-1">Risk Score <ArrowUpDown className="h-3 w-3" /></span>
            </th>
            <th className="text-center px-4 py-3 text-small font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
            <th className="text-center px-4 py-3 text-small font-semibold text-muted-foreground uppercase tracking-wider">Path</th>
            <th className="text-left px-4 py-3 text-small font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
            <th className="text-left px-4 py-3 text-small font-semibold text-muted-foreground uppercase tracking-wider">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => {
            const resPath = getResolutionPath(c.win_probability);
            return (
              <tr
                key={c.id}
                onClick={() => navigate(`/case/${c.id}`)}
                className="zebra-row cursor-pointer border-b border-border last:border-0 transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="text-small font-mono text-muted-foreground">
                    {c.id.slice(0, 8).toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3 max-w-[300px]">
                  <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                  <p className="text-small text-muted-foreground truncate">{c.summary || "No summary"}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-heading font-semibold tabular-nums text-foreground">
                    {c.win_probability ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${getPriorityBadgeClass(c.priority)}`}>
                    {getPriorityLabel(c.priority)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${getResolutionClass(resPath)}`}>
                    {resPath}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-small text-muted-foreground">{c.case_type || "General"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-small text-muted-foreground tabular-nums">
                    {new Date(c.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
