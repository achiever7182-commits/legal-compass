import { useRef, useEffect } from "react";
import { Scale, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { Msg, Mode } from "./types";
import { MODE_CONFIG, QUICK_PROMPTS } from "./types";

interface ChatMessagesProps {
  messages: Msg[];
  mode: Mode;
  isStreaming: boolean;
  onSend: (text: string) => void;
}

export default function ChatMessages({ messages, mode, isStreaming, onSend }: ChatMessagesProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex flex-col items-center justify-center py-16 space-y-6">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Scale className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-subheading font-semibold text-foreground">{MODE_CONFIG[mode].label}</h2>
              <p className="text-body text-muted-foreground max-w-md">{MODE_CONFIG[mode].description}</p>
            </div>
            {mode !== "voice" && (
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {QUICK_PROMPTS[mode].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => onSend(prompt)}
                    className="text-small bg-card border border-border rounded-lg px-4 py-2.5 text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {msg.role === "user" ? (
              <div className="flex justify-end">
                <div className="bg-primary/10 border border-primary/20 rounded-xl px-5 py-3 max-w-[80%]">
                  <p className="text-label text-muted-foreground mb-1">Case Input</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="h-4 w-4 text-primary" />
                  <p className="text-label text-primary font-medium">System Findings</p>
                </div>
                <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-ul:text-muted-foreground prose-li:text-muted-foreground">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing case data... Analyzing evidence...</p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
}
