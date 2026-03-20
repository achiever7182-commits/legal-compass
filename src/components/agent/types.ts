import { MessageSquare, Search, FileEdit, Mail, Mic } from "lucide-react";

export type Msg = { role: "user" | "assistant"; content: string };
export type Mode = "chat" | "research" | "draft" | "email" | "voice";

export const MODE_CONFIG: Record<Mode, { label: string; icon: typeof MessageSquare; description: string }> = {
  chat: { label: "Legal Chat", icon: MessageSquare, description: "Ask questions about Indian law" },
  research: { label: "Research", icon: Search, description: "Find laws, precedents & judgments" },
  draft: { label: "Draft", icon: FileEdit, description: "Generate legal documents" },
  email: { label: "Notice", icon: Mail, description: "Generate legal notice emails" },
  voice: { label: "Voice", icon: Mic, description: "Voice-based legal assistant" },
};

export const QUICK_PROMPTS: Record<Mode, string[]> = {
  chat: [
    "What are the grounds for bail under BNSS?",
    "Explain Section 103 of BNS (formerly 498A IPC)",
    "What is anticipatory bail under BNSS?",
  ],
  research: [
    "Find precedents for landlord-tenant disputes in India",
    "Research consumer protection laws for defective products",
    "Find landmark Supreme Court cases on right to privacy",
  ],
  draft: [
    "Draft a legal notice for breach of contract",
    "Draft a bail application under BNSS",
    "Draft a petition for consumer complaint",
  ],
  email: [
    "Send legal notice for unpaid rent of 3 months",
    "Send notice for breach of employment contract",
    "Send consumer complaint notice for defective product",
  ],
  voice: [
    "Click the microphone to start speaking",
  ],
};
