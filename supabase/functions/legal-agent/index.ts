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

    const GEMINI_API_KEY = Deno.env.get("gemini");
    if (!GEMINI_API_KEY) throw new Error("Gemini API key is not configured");

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
Evidence: ${evidence?.map(e => `- ${e.description} (${e.strength})`).join("\n") || "None"}
Timeline: ${JSON.stringify(caseData.timeline)}
--- END CASE CONTEXT ---`;
      }
    }

    const systemPrompt = (SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat) + caseContext;

    // Convert messages to Gemini format
    const geminiContents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Understood. I'm ready to assist with Indian law queries." }] },
    ];

    for (const msg of messages) {
      geminiContents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: geminiContents }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    // Transform Gemini SSE stream to OpenAI-compatible SSE stream
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                // Emit in OpenAI-compatible format
                const chunk = JSON.stringify({
                  choices: [{ delta: { content: text } }],
                });
                await writer.write(encoder.encode(`data: ${chunk}\n\n`));
              }
            } catch {
              // ignore parse errors
            }
          }
        }

        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream transform error:", e);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
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
