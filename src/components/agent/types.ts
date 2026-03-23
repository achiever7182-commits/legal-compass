import { Scale, Search, FileEdit, Mail, Mic } from "lucide-react";

export type Msg = { role: "user" | "assistant"; content: string };
export type Mode = "chat" | "research" | "draft" | "email" | "voice";

export const MODE_CONFIG: Record<Mode, { label: string; icon: typeof Scale; description: string }> = {
  chat: { label: "Case Analysis", icon: Scale, description: "Enter dispute details for triage and legal analysis" },
  research: { label: "Legal Research", icon: Search, description: "Search laws, precedents, and judicial opinions" },
  draft: { label: "Document Drafting", icon: FileEdit, description: "Generate court-ready legal documents" },
  email: { label: "Legal Notice", icon: Mail, description: "Generate structured legal notice communications" },
  voice: { label: "Voice Input", icon: Mic, description: "Voice-based case analysis interface" },
};

export const QUICK_PROMPTS: Record<Mode, string[]> = {
  chat: [
    "Analyze grounds for bail under BNSS provisions",
    "Explain Section 103 of BNS (formerly 498A IPC)",
    "Determine jurisdiction for cross-state dispute",
  ],
  research: [
    "Find precedents for landlord-tenant disputes under Transfer of Property Act",
    "Research consumer protection framework for defective products",
    "Identify landmark Supreme Court rulings on right to privacy",
  ],
  draft: [
    "Draft legal notice for breach of contract under Indian Contract Act",
    "Draft bail application under BNSS provisions",
    "Draft petition for consumer complaint under CPA 2019",
  ],
  email: [
    "Generate legal notice for 3 months unpaid commercial rent",
    "Generate notice for breach of employment contract terms",
    "Generate consumer complaint notice for defective product",
  ],
  voice: [
    "Activate microphone for voice-based case input",
  ],
};
