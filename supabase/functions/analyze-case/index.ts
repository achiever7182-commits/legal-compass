import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, fileName } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "No text provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const truncatedText = text.slice(0, 15000);

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: `You are an AI legal assistant specializing in Indian law. Analyze the following legal case text and return ONLY a valid JSON object (no markdown, no code fences) with this exact schema:
{
  "title": "Short descriptive title for the case",
  "summary": "2-3 sentence summary of the case",
  "case_type": "Civil/Criminal/Constitutional/Family/Corporate/Labour/Tax/Other",
  "priority": "High/Medium/Low",
  "key_evidence": [{"description": "evidence description", "strength": "Strong/Medium/Weak"}],
  "legal_strategy": "Recommended legal strategy paragraph",
  "relevant_laws": ["Section X of IPC", "Article Y of Constitution"],
  "win_probability": 65,
  "timeline": [{"date": "YYYY-MM-DD", "event": "event description"}]
}

Case text:
${truncatedText}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "analyze_case",
                description: "Return structured case analysis",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    summary: { type: "string" },
                    case_type: { type: "string", enum: ["Civil", "Criminal", "Constitutional", "Family", "Corporate", "Labour", "Tax", "Other"] },
                    priority: { type: "string", enum: ["High", "Medium", "Low"] },
                    key_evidence: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          description: { type: "string" },
                          strength: { type: "string", enum: ["Strong", "Medium", "Weak"] },
                        },
                        required: ["description", "strength"],
                      },
                    },
                    legal_strategy: { type: "string" },
                    relevant_laws: { type: "array", items: { type: "string" } },
                    win_probability: { type: "number" },
                    timeline: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          date: { type: "string" },
                          event: { type: "string" },
                        },
                        required: ["date", "event"],
                      },
                    },
                  },
                  required: ["title", "summary", "case_type", "priority", "key_evidence", "legal_strategy", "relevant_laws", "win_probability", "timeline"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "analyze_case" } },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    
    let analysis;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      analysis = JSON.parse(toolCall.function.arguments);
    } else {
      const content = aiData.choices?.[0]?.message?.content;
      if (!content) throw new Error("No response from AI");
      analysis = JSON.parse(content);
    }

    if (!analysis.title && fileName) {
      analysis.title = fileName.replace(/\.[^/.]+$/, "");
    }

    // Save to database using service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .insert({
        title: analysis.title || "Untitled Case",
        summary: analysis.summary,
        case_type: analysis.case_type,
        priority: analysis.priority,
        legal_strategy: analysis.legal_strategy,
        win_probability: typeof analysis.win_probability === "number" ? analysis.win_probability : parseInt(analysis.win_probability) || 50,
        relevant_laws: analysis.relevant_laws || [],
        timeline: analysis.timeline || [],
      })
      .select()
      .single();

    if (caseError) throw caseError;

    if (analysis.key_evidence?.length > 0) {
      const evidenceRows = analysis.key_evidence.map((e: { description: string; strength: string }) => ({
        case_id: caseData.id,
        description: e.description,
        strength: e.strength,
      }));
      await supabase.from("evidence").insert(evidenceRows);
    }

    return new Response(JSON.stringify({ success: true, case: caseData, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-case error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
