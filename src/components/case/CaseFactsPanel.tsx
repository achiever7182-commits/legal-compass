import { Scale, FileText, Clock, Shield } from "lucide-react";
import type { Case, Evidence } from "@/lib/api";

function getPriorityBadgeClass(priority: string | null): string {
  switch (priority) {
    case "High": return "bg-destructive/10 text-destructive";
    case "Medium": return "bg-warning/10 text-warning";
    case "Low": return "bg-success/10 text-success";
    default: return "bg-muted text-muted-foreground";
  }
}

function getStrengthColor(strength: string | null): string {
  switch (strength) {
    case "Strong": return "bg-success";
    case "Medium": return "bg-warning";
    case "Weak": return "bg-destructive";
    default: return "bg-muted-foreground";
  }
}

interface Props {
  caseData: Case;
  evidence: Evidence[];
}

export default function CaseFactsPanel({ caseData, evidence }: Props) {
  const timeline = Array.isArray(caseData.timeline) ? (caseData.timeline as Array<{ date: string; event: string }>) : [];
  const laws = Array.isArray(caseData.relevant_laws) ? (caseData.relevant_laws as string[]) : [];

  return (
    <div className="p-6 space-y-6">
      {/* Case header */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${getPriorityBadgeClass(caseData.priority)}`}>
            {caseData.priority || "Unrated"} Priority
          </span>
          <span className="text-small text-muted-foreground">{caseData.case_type || "General"}</span>
        </div>
        <h1 className="text-heading text-foreground">{caseData.title}</h1>
        <div className="flex items-center gap-4 mt-2 text-small text-muted-foreground">
          <span className="font-mono tabular-nums">ID: {caseData.id.slice(0, 8).toUpperCase()}</span>
          <span>{new Date(caseData.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
        </div>
      </div>

      {/* Case Overview */}
      <section className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="h-5 w-5 text-primary" />
          <h2 className="text-subheading text-foreground">Case Overview</h2>
        </div>
        <p className="text-body text-muted-foreground leading-relaxed">{caseData.summary || "No summary available."}</p>
      </section>

      {/* Legal Strategy / Key Facts */}
      {caseData.legal_strategy && (
        <section className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-subheading text-foreground">Legal Strategy</h2>
          </div>
          <p className="text-body text-muted-foreground leading-relaxed">{caseData.legal_strategy}</p>
        </section>
      )}

      {/* Evidence */}
      <section className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-subheading text-foreground">Key Evidence</h2>
          <span className="text-small text-muted-foreground ml-auto">{evidence.length} items</span>
        </div>
        {evidence.length > 0 ? (
          <div className="space-y-3">
            {evidence.map((e) => (
              <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getStrengthColor(e.strength)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{e.description}</p>
                  <span className="text-small text-muted-foreground">{e.strength} evidence</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body text-muted-foreground">No evidence extracted.</p>
        )}
      </section>

      {/* Timeline */}
      {timeline.length > 0 && (
        <section className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-subheading text-foreground">Incident Timeline</h2>
          </div>
          <div className="relative pl-6">
            <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />
            <div className="space-y-4">
              {timeline.map((item, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-4 top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card" />
                  <div className="text-small text-muted-foreground tabular-nums font-medium">{item.date}</div>
                  <div className="text-sm text-foreground mt-0.5">{item.event}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Legal Classification */}
      {laws.length > 0 && (
        <section className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="h-5 w-5 text-primary" />
            <h2 className="text-subheading text-foreground">Legal Classification</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {laws.map((law, i) => (
              <span key={i} className="text-small bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
                {law}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
