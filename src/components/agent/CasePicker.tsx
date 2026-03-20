import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import type { Case } from "@/lib/api";

interface CasePickerProps {
  show: boolean;
  cases: Case[];
  selectedCase: Case | null;
  onSelect: (c: Case) => void;
}

export default function CasePicker({ show, cases, selectedCase, onSelect }: CasePickerProps) {
  return (
    <AnimatePresence>
      {show && cases.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-border bg-card overflow-hidden"
        >
          <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap gap-2">
            {cases.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  selectedCase?.id === c.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
