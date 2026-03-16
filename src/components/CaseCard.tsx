import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { Case } from "@/lib/api";

function getPriorityClass(priority: string | null) {
  switch (priority) {
    case "High": return "priority-high";
    case "Medium": return "priority-medium";
    case "Low": return "priority-low";
    default: return "priority-low";
  }
}

export default function CaseCard({ caseData }: { caseData: Case }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/case/${caseData.id}`)}
      className="group relative bg-card p-4 rounded-lg surface-card cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${getPriorityClass(caseData.priority)}`}>
          {caseData.priority || "Unknown"}
        </span>
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          {caseData.win_probability ?? "—"}% Win
        </span>
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1 leading-tight line-clamp-2">
        {caseData.title}
      </h3>
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {caseData.summary || "No summary available"}
      </p>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
          {caseData.case_type || "General"}
        </span>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {new Date(caseData.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
        </span>
      </div>
    </motion.div>
  );
}
