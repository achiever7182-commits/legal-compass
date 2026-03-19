import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  chat: `You are JusticeBridge AI — an expert legal assistant specializing in Indian law. You help lawyers analyze cases, understand legal precedents, and provide strategic advice. Be precise, cite relevant sections of Indian law when applicable, and maintain a professional tone. Use markdown formatting for clarity.`,
  research: `You are JusticeBridge Research Agent — a legal research specialist for Indian law. When given a query:
- Search for relevant Indian laws, sections, and acts
- Cite specific legal precedents and landmark judgments
- Provide analysis of how laws apply to the situation
- Reference IPC, CrPC, CPC, Constitution of India, and other relevant statutes
Format your response with clear headings, bullet points, and citations using markdown.`,
  draft: `You are JusticeBridge Document Drafter — a legal document generation specialist for Indian courts. When asked to draft a document:
- Use proper legal formatting and language appropriate for Indian courts
- Include relevant sections and citations
- Follow the standard format for the document type (petition, notice, affidavit, etc.)
- Add placeholders like [COURT NAME], [PETITIONER NAME], etc. where specific details are needed
Format the entire document in markdown with clear sections.`,
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

    // The gateway already returns OpenAI-compatible SSE, so pass through directly
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
