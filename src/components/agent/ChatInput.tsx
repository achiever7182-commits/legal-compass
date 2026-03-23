import { useRef } from "react";
import { Send, X } from "lucide-react";
import type { Mode } from "./types";

interface ChatInputProps {
  input: string;
  mode: Mode;
  isStreaming: boolean;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onStop: () => void;
}

export default function ChatInput({ input, mode, isStreaming, onInputChange, onSend, onStop }: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const placeholder =
    mode === "chat" ? "Enter dispute details for triage..."
    : mode === "research" ? "Describe the legal research query..."
    : mode === "draft" ? "Specify the document to draft..."
    : mode === "email" ? "Describe the legal notice to generate..."
    : "Use the microphone for voice input...";

  return (
    <div className="border-t border-border bg-card flex-shrink-0">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-end gap-3 bg-background border border-border rounded-xl px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none max-h-32"
            style={{ minHeight: "24px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "24px";
              target.style.height = target.scrollHeight + "px";
            }}
          />
          {isStreaming ? (
            <button
              onClick={onStop}
              className="w-9 h-9 rounded-lg bg-destructive flex items-center justify-center text-destructive-foreground hover:bg-destructive/90 transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onSend}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-3">
          This is an AI-generated legal analysis. Please verify with a qualified legal professional before taking action.
        </p>
      </div>
    </div>
  );
}
