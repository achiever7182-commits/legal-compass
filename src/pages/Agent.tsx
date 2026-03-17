import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Scale, Send, Bot, User, MessageSquare, Search, FileEdit, Loader2, ArrowLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { fetchCases, fetchCaseById } from "@/lib/api";
import { streamAgent } from "@/lib/agent-stream";
import type { Case } from "@/lib/api";

type Msg = { role: "user" | "assistant"; content: string };
type Mode = "chat" | "research" | "draft";

const MODE_CONFIG: Record<Mode, { label: string; icon: typeof MessageSquare; description: string }> = {
  chat: { label: "Legal Chat", icon: MessageSquare, description: "Ask questions about Indian law" },
  research: { label: "Research", icon: Search, description: "Find laws, precedents & judgments" },
  draft: { label: "Draft", icon: FileEdit, description: "Generate legal documents" },
};

const QUICK_PROMPTS: Record<Mode, string[]> = {
  chat: [
    "What are the grounds for bail under CrPC?",
    "Explain Section 498A of IPC",
    "What is anticipatory bail?",
  ],
  research: [
    "Find precedents for landlord-tenant disputes in India",
    "Research consumer protection laws for defective products",
    "Find landmark Supreme Court cases on right to privacy",
  ],
  draft: [
    "Draft a legal notice for breach of contract",
    "Draft a bail application under Section 439 CrPC",
    "Draft a petition for consumer complaint",
  ],
};

export default function Agent() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showCasePicker, setShowCasePicker] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: cases = [] } = useQuery({
    queryKey: ["cases"],
    queryFn: fetchCases,
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Msg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamAgent({
        messages: newMessages,
        mode,
        caseId: selectedCase?.id,
        onDelta: upsertAssistant,
        onDone: () => setIsStreaming(false),
        signal: controller.signal,
      });
    } catch (e: any) {
      if (e.name === "AbortError") return;
      console.error(e);
      toast.error(e.message || "Agent failed");
      setIsStreaming(false);
    }
  }, [messages, mode, selectedCase, isStreaming]);

  const handleStop = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
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

          {/* Case context badge */}
          <div className="flex items-center gap-2">
            {selectedCase && (
              <div className="flex items-center gap-1.5 bg-primary/10 text-primary text-[10px] font-medium px-2 py-1 rounded-md">
                <Scale className="h-3 w-3" />
                <span className="max-w-[120px] truncate">{selectedCase.title}</span>
                <button onClick={() => setSelectedCase(null)} className="hover:text-primary/70">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <button
              onClick={() => setShowCasePicker(!showCasePicker)}
              className="text-[10px] text-muted-foreground hover:text-foreground border border-border rounded-md px-2 py-1 transition-colors"
            >
              {selectedCase ? "Switch case" : "Attach case"}
            </button>
          </div>
        </div>
      </header>

      {/* Case picker dropdown */}
      <AnimatePresence>
        {showCasePicker && cases.length > 0 && (
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
                  onClick={() => { setSelectedCase(c); setShowCasePicker(false); }}
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

      {/* Mode tabs */}
      <div className="border-b border-border bg-card flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 flex gap-1">
          {(Object.keys(MODE_CONFIG) as Mode[]).map((m) => {
            const { label, icon: Icon } = MODE_CONFIG[m];
            return (
              <button
                key={m}
                onClick={() => { setMode(m); clearChat(); }}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
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

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Bot className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <h2 className="text-base font-semibold text-foreground">
                  {MODE_CONFIG[mode].label}
                </h2>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {mode === "chat" && "Ask me anything about Indian law, legal procedures, or case strategy."}
                  {mode === "research" && "I'll research laws, precedents, and landmark judgments for you."}
                  {mode === "draft" && "Tell me what document you need and I'll draft it for you."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {QUICK_PROMPTS[mode].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    className="text-xs bg-card border border-border rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors surface-card text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border surface-card"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:rounded">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))
          )}

          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-3.5 w-3.5 text-primary animate-pulse" />
              </div>
              <div className="bg-card border border-border rounded-xl px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-card flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2 bg-background border border-border rounded-xl px-3 py-2 focus-within:border-primary transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === "chat" ? "Ask a legal question…"
                : mode === "research" ? "What should I research?"
                : "What document should I draft?"
              }
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
                onClick={handleStop}
                className="w-8 h-8 rounded-lg bg-destructive flex items-center justify-center text-destructive-foreground hover:bg-destructive/90 transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => send(input)}
                disabled={!input.trim()}
                className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            AI responses are for informational purposes only and do not constitute legal advice.
          </p>
        </div>
      </div>
    </div>
  );
}
