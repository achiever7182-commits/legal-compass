import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { fetchCases, fetchCaseById } from "@/lib/api";
import { streamAgent } from "@/lib/agent-stream";
import type { Case } from "@/lib/api";
import type { Msg, Mode } from "@/components/agent/types";
import AgentHeader from "@/components/agent/AgentHeader";
import CasePicker from "@/components/agent/CasePicker";
import ModeTabs from "@/components/agent/ModeTabs";
import ChatMessages from "@/components/agent/ChatMessages";
import ChatInput from "@/components/agent/ChatInput";
import VoicePanel from "@/components/agent/VoicePanel";

export default function Agent() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>((searchParams.get("mode") as Mode) || "chat");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [showCasePicker, setShowCasePicker] = useState(false);
  const [preloaded, setPreloaded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const { data: cases = [] } = useQuery({ queryKey: ["cases"], queryFn: fetchCases });

  const preloadCaseId = searchParams.get("caseId");
  const { data: preloadedCase } = useQuery({
    queryKey: ["case", preloadCaseId],
    queryFn: () => fetchCaseById(preloadCaseId!),
    enabled: !!preloadCaseId && !preloaded,
  });

  useEffect(() => {
    if (preloadedCase && !preloaded) {
      setSelectedCase(preloadedCase);
      setPreloaded(true);
    }
  }, [preloadedCase, preloaded]);

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
        mode: mode === "voice" ? "chat" : mode,
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

  const handleModeChange = (m: Mode) => {
    setMode(m);
    setMessages([]);
    setInput("");
  };

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant")?.content || null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AgentHeader
        mode={mode}
        selectedCase={selectedCase}
        onClearCase={() => setSelectedCase(null)}
        onToggleCasePicker={() => setShowCasePicker(!showCasePicker)}
      />

      <CasePicker
        show={showCasePicker}
        cases={cases}
        selectedCase={selectedCase}
        onSelect={(c) => { setSelectedCase(c); setShowCasePicker(false); }}
      />

      <ModeTabs mode={mode} onModeChange={handleModeChange} />

      {mode === "voice" ? (
        <>
          <ChatMessages messages={messages} mode={mode} isStreaming={isStreaming} onSend={send} />
          {messages.length === 0 && (
            <VoicePanel
              onTranscript={send}
              lastAssistantMessage={lastAssistantMessage}
              isStreaming={isStreaming}
            />
          )}
          {messages.length > 0 && (
            <div className="border-t border-border bg-card flex-shrink-0">
              <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-center gap-4">
                <VoicePanel
                  onTranscript={send}
                  lastAssistantMessage={lastAssistantMessage}
                  isStreaming={isStreaming}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <ChatMessages messages={messages} mode={mode} isStreaming={isStreaming} onSend={send} />
          <ChatInput
            input={input}
            mode={mode}
            isStreaming={isStreaming}
            onInputChange={setInput}
            onSend={() => send(input)}
            onStop={handleStop}
          />
        </>
      )}
    </div>
  );
}
