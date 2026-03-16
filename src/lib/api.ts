import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Case = Tables<"cases">;
export type Evidence = Tables<"evidence">;

export async function fetchCases(): Promise<Case[]> {
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchCaseById(id: string): Promise<Case> {
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchEvidenceByCaseId(caseId: string): Promise<Evidence[]> {
  const { data, error } = await supabase
    .from("evidence")
    .select("*")
    .eq("case_id", caseId);
  if (error) throw error;
  return data || [];
}

export async function deleteCase(id: string): Promise<void> {
  const { error } = await supabase.from("cases").delete().eq("id", id);
  if (error) throw error;
}

export async function analyzeCase(text: string, fileName: string) {
  const { data, error } = await supabase.functions.invoke("analyze-case", {
    body: { text, fileName },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}
