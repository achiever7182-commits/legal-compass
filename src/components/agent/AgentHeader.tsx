import { Scale, X } from "lucide-react";
import type { Case } from "@/lib/api";
import type { Mode } from "./types";
import { MODE_CONFIG } from "./types";

interface AgentHeaderProps {
  mode: Mode;
  selectedCase: Case | null;
  onClearCase: () => void;
  onToggleCasePicker: () => void;
}

export default function AgentHeader({ mode, selectedCase, onClearCase, onToggleCasePicker }: AgentHeaderProps) {
  return (
    <div className="border-b border-border bg-card flex-shrink-0">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-subheading font-semibold text-foreground">Case Analysis Console</h1>
          <p className="text-small text-muted-foreground">{MODE_CONFIG[mode].description}</p>
        </div>

        <div className="flex items-center gap-3">
          {selectedCase && (
            <div className="flex items-center gap-2 bg-primary/10 text-primary text-small font-medium px-3 py-1.5 rounded-lg">
              <Scale className="h-4 w-4" />
              <span className="max-w-[160px] truncate">{selectedCase.title}</span>
              <button onClick={onClearCase} className="hover:text-primary/70">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <button
            onClick={onToggleCasePicker}
            className="text-small text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors font-medium"
          >
            {selectedCase ? "Switch case" : "Attach case"}
          </button>
        </div>
      </div>
    </div>
  );
}
