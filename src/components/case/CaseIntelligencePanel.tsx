import { BarChart3, AlertTriangle, Scale, BookOpen } from "lucide-react";
import type { Case, Evidence } from "@/lib/api";

function getResolutionPath(winProbability: number | null): string {
  if (!winProbability) return "REVIEW";
  if (winProbability >= 70) return "COURT";
  if (winProbability >= 40) return "MEDIATION";
  return "ODR";
}

function getResolutionDescription(path: string): string {
  switch (path) {
    case "COURT": return "High complexity case recommended for formal court proceedings.";
    case "MEDIATION": return "Moderate complexity. Mediation recommended as primary resolution.";
    case "ODR": return "Suitable for Online Dispute Resolution platform.";
    default: return "Requires further review before routing.";
  }
}

interface Props {
  caseData: Case;
  evidence: Evidence[];
}

export default function CaseIntelligencePanel({ caseData, evidence }: Props) {
  const resolutionPath = getResolutionPath(caseData.win_probability);
  const laws = Array.isArray(caseData.relevant_laws) ? (caseData.relevant_laws as string[]) : [];

  const strongCount = evidence.filter((e) => e.strength === "Strong").length;
  const mediumCount = evidence.filter((e) => e.strength === "Medium").length;
  const weakCount = evidence.filter((e) => e.strength === "Weak").length;
  const total = evidence.length || 1;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-subheading text-foreground font-semibold">Triage & Analysis Summary</h2>

      {/* Risk Score */}
      <div className="bg-card rounded-lg border border-border p-6 text-center">
        <p className="text-small text-muted-foreground uppercase tracking-wider mb-2">Risk Score</p>
        <div className="text-[48px] font-semibold tabular-nums text-foreground leading-none">
          {caseData.win_probability ?? "—"}
        </div>
        <p className="text-small text-muted-foreground mt-2">out of 100</p>
      </div>

      {/* Priority Rationale */}
      <section className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <h3 className="text-label font-semibold text-foreground">Priority Rationale</h3>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 flex-shrink-0" />
            Risk score of {caseData.win_probability ?? 0} indicates {(caseData.win_probability ?? 0) >= 70 ? "high" : (caseData.win_probability ?? 0) >= 40 ? "moderate" : "low"} case complexity
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 flex-shrink-0" />
            {evidence.length} evidence item{evidence.length !== 1 ? "s" : ""} collected — {strongCount} strong, {mediumCount} medium, {weakCount} weak
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 flex-shrink-0" />
            Case type: {caseData.case_type || "General"} — Priority: {caseData.priority || "Unrated"}
          </li>
          {laws.length > 0 && (
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 flex-shrink-0" />
              {laws.length} applicable legal provision{laws.length !== 1 ? "s" : ""} identified
            </li>
          )}
        </ul>
      </section>

      {/* Evidence Strength Breakdown */}
      {evidence.length > 0 && (
        <section className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-label font-semibold text-foreground">Risk Breakdown</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Strong Evidence", count: strongCount, color: "bg-success" },
              { label: "Medium Evidence", count: mediumCount, color: "bg-warning" },
              { label: "Weak Evidence", count: weakCount, color: "bg-destructive" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-small mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-foreground font-medium tabular-nums">{item.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all`}
                    style={{ width: `${(item.count / total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recommended Resolution Path */}
      <section className="bg-primary/5 rounded-lg border-2 border-primary/20 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Scale className="h-5 w-5 text-primary" />
          <h3 className="text-label font-semibold text-foreground">Recommended Resolution Path</h3>
        </div>
        <div className="text-heading font-semibold text-primary mb-2">{resolutionPath}</div>
        <p className="text-sm text-muted-foreground">{getResolutionDescription(resolutionPath)}</p>
      </section>

      {/* Applicable Legal Framework */}
      {laws.length > 0 && (
        <section className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-label font-semibold text-foreground">Applicable Legal Framework</h3>
          </div>
          <ul className="space-y-2">
            {laws.map((law, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                {law}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
