import type { Mode } from "./types";
import { MODE_CONFIG } from "./types";

interface ModeTabsProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

export default function ModeTabs({ mode, onModeChange }: ModeTabsProps) {
  return (
    <div className="border-b border-border bg-card flex-shrink-0">
      <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto">
        {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => {
          const { label, icon: Icon } = MODE_CONFIG[m];
          return (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                mode === m
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
