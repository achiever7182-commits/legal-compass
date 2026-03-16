import type { Case } from "@/lib/api";
import CaseCard from "./CaseCard";

interface PriorityColumnProps {
  priority: string;
  cases: Case[];
  color: string;
}

export default function PriorityColumn({ priority, cases, color }: PriorityColumnProps) {
  return (
    <div className="flex-1 min-w-[280px]">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: color }} />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
          {priority} Priority
        </h2>
        <span className="text-xs font-mono text-muted-foreground tabular-nums ml-auto">
          {cases.length}
        </span>
      </div>
      <div className="space-y-3">
        {cases.length === 0 ? (
          <div className="text-xs text-muted-foreground px-4 py-8 text-center border border-dashed border-border rounded-lg">
            No {priority.toLowerCase()} priority cases
          </div>
        ) : (
          cases.map((c) => <CaseCard key={c.id} caseData={c} />)
        )}
      </div>
    </div>
  );
}
