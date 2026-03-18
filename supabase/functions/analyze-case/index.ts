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

    // Extract user from auth header
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id ?? null;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const truncatedText = text.slice(0, 15000);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are an AI legal assistant specializing in Indian law. Always return valid JSON only, no markdown.",
          },
          {
            role: "user",
            content: `Analyze the following legal case text and return a valid JSON object with this exact schema:
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
              description: "Return structured legal case analysis",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  case_type: { type: "string" },
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
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_case" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let analysis;

    if (toolCall?.function?.arguments) {
      analysis = JSON.parse(toolCall.function.arguments);
    } else {
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Failed to parse AI response");
      analysis = JSON.parse(jsonMatch[0]);
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
        user_id: userId,
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
