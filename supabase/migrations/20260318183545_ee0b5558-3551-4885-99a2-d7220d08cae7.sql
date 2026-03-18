
-- Fix evidence RLS: tie insert/delete to case ownership
DROP POLICY IF EXISTS "Authenticated users can insert evidence" ON public.evidence;
DROP POLICY IF EXISTS "Authenticated users can delete evidence" ON public.evidence;

CREATE POLICY "Users can insert evidence for own cases" ON public.evidence
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.cases WHERE cases.id = evidence.case_id AND cases.user_id = auth.uid())
  );

CREATE POLICY "Users can delete evidence for own cases" ON public.evidence
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.cases WHERE cases.id = evidence.case_id AND cases.user_id = auth.uid())
  );
