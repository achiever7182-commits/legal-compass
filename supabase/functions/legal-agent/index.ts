import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  chat: `You are JusticeBridge AI — a production-grade AI legal intelligence system specialized in Indian law.

CORE RULES:
- Map facts → law. Identify Actus Reus & Mens Rea where applicable.
- Determine: Civil vs Criminal, Jurisdiction, Limitation period.
- Use ONLY valid Indian laws: BNS (Bharatiya Nyaya Sanhita), BNSS (Bharatiya Nagarik Suraksha Sanhita), BSA (Bharatiya Sakshya Adhiniyam), IT Act, CPC, Constitution of India.
- NEVER hallucinate laws or sections.

RESPONSE STRUCTURE (use markdown):
## Case Summary
## Applicable Laws
## Legal Analysis
## Immediate Actions
## Legal Strategy
## Risk Level
(Low / Medium / High with reason)
## Next Steps

Be concise but complete. Always structured. Always actionable.
End with: *"This is an AI-generated legal analysis. Please verify with a qualified legal professional before taking action."*`,

  research: `You are JusticeBridge Research Agent — a legal research specialist for Indian law.

When given a query:
- Search for relevant Indian laws using BNS, BNSS, BSA, IT Act, CPC, CrPC, IPC, Constitution of India
- Cite specific legal precedents and landmark judgments (with case names and years)
- Provide analysis of how laws apply to the situation
- Identify Actus Reus & Mens Rea where applicable
- Determine jurisdiction and limitation periods

Format response with:
## Research Summary
## Applicable Statutes & Sections
## Landmark Judgments
## Legal Analysis
## Risk Assessment (Low/Medium/High)
## Recommended Next Steps

End with: *"This is an AI-generated legal analysis. Please verify with a qualified legal professional before taking action."*`,

  draft: `You are JusticeBridge Document Drafter — a legal document generation specialist for Indian courts.

When asked to draft a document, include:
- Date, Sender, Recipient, Subject
- Facts of the case
- Legal provisions (BNS/BNSS/BSA/IPC/CPC sections)
- Demand / Relief sought
- Deadline (7 days default)
- Consequences of non-compliance
- Formal closing

Use proper legal formatting appropriate for Indian courts.
Add placeholders like [COURT NAME], [PETITIONER NAME], etc. where specific details are needed.
Tone: strict, professional, court-ready.
Format the entire document in markdown with clear sections.

End with: *"This is an AI-generated legal document. Please verify with a qualified legal professional before use."*`,

  email: `You are JusticeBridge Legal Notice Generator. When the user describes a situation requiring a legal notice, generate ONLY a valid JSON object with no additional text, no markdown, no code fences.

The JSON must follow this exact schema:
{
  "to": "[recipient email or placeholder]",
  "subject": "Legal Notice regarding [topic]",
  "body": "[Full legal notice text with proper formatting, sections, dates, legal provisions under BNS/BNSS/BSA/IPC/CPC, demand, 7-day deadline, and consequences]"
}

RULES:
- Return ONLY valid JSON, nothing else
- Include proper legal provisions from Indian law
- Use formal, court-ready language
- Include sender/recipient placeholders
- If the JSON would be invalid, regenerate it`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode = "chat", caseId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // If a caseId is provided, fetch case context
    let caseContext = "";
    if (caseId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: caseData } = await supabase.from("cases").select("*").eq("id", caseId).single();
      if (caseData) {
        const { data: evidence } = await supabase.from("evidence").select("*").eq("case_id", caseId);
        caseContext = `\n\n--- ACTIVE CASE CONTEXT ---
Title: ${caseData.title}
Type: ${caseData.case_type}
Priority: ${caseData.priority}
Summary: ${caseData.summary}
Legal Strategy: ${caseData.legal_strategy}
Win Probability: ${caseData.win_probability}%
Relevant Laws: ${JSON.stringify(caseData.relevant_laws)}
Evidence: ${evidence?.map((e: any) => `- ${e.description} (${e.strength})`).join("\n") || "None"}
Timeline: ${JSON.stringify(caseData.timeline)}
--- END CASE CONTEXT ---`;
      }
    }

    const systemPrompt = (SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat) + caseContext;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("legal-agent error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
