import { useNavigate } from "react-router-dom";
import { Bot, Scale, X, ArrowLeft } from "lucide-react";
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
  const navigate = useNavigate();

  return (
    <header className="border-b border-border bg-card flex-shrink-0">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">JusticeBridge AI Agent</h1>
            <p className="text-[10px] text-muted-foreground">{MODE_CONFIG[mode].description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedCase && (
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary text-[10px] font-medium px-2 py-1 rounded-md">
              <Scale className="h-3 w-3" />
              <span className="max-w-[120px] truncate">{selectedCase.title}</span>
              <button onClick={onClearCase} className="hover:text-primary/70">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <button
            onClick={onToggleCasePicker}
            className="text-[10px] text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1 transition-colors"
          >
            {selectedCase ? "Switch case" : "Attach case"}
          </button>
        </div>
      </div>
    </header>
  );
}
