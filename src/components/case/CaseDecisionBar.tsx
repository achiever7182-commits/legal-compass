import { useState } from "react";
import { Scale, Users, Globe, CheckSquare } from "lucide-react";
import { toast } from "sonner";

interface Props {
  caseId: string;
}

export default function CaseDecisionBar({ caseId }: Props) {
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const handleDecision = (type: string) => {
    // In production this would POST to /judge/case-decision
    toast.success(`Case routed to ${type}. Decision recorded.`);
    setShowConfirm(null);
    setNotes("");
  };

  const actions = [
    { key: "COURT", label: "Assign to Court", icon: Scale, className: "bg-primary text-primary-foreground hover:bg-primary/90" },
    { key: "MEDIATION", label: "Route to Mediation", icon: Users, className: "bg-warning text-warning-foreground hover:bg-warning/90" },
    { key: "ODR", label: "Route to ODR", icon: Globe, className: "bg-success text-success-foreground hover:bg-success/90" },
    { key: "REVIEWED", label: "Mark as Reviewed", icon: CheckSquare, className: "bg-secondary text-secondary-foreground hover:bg-secondary/80" },
  ];

  return (
    <>
      <div className="border-t border-border bg-card px-6 py-4 flex items-center justify-between flex-shrink-0">
        <p className="text-small text-muted-foreground">Case Decision</p>
        <div className="flex items-center gap-2">
          {actions.map((action) => (
            <button
              key={action.key}
              onClick={() => setShowConfirm(action.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-small font-medium rounded-lg transition-colors ${action.className}`}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md shadow-lg mx-4">
            <h3 className="text-subheading text-foreground mb-2">Confirm Decision</h3>
            <p className="text-body text-muted-foreground mb-4">
              You are about to route this case to <strong className="text-foreground">{showConfirm}</strong>. This action will be logged.
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional reason or notes..."
              rows={3}
              className="w-full border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground bg-background focus:outline-none focus:ring-2 focus:ring-ring mb-4 resize-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowConfirm(null); setNotes(""); }}
                className="px-4 py-2 text-small font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDecision(showConfirm)}
                className="px-4 py-2 text-small font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
