-- Drop existing RLS policies that require auth
DROP POLICY IF EXISTS "Users can view own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can insert own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can update own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can delete own cases" ON public.cases;
DROP POLICY IF EXISTS "Users can view evidence for own cases" ON public.evidence;
DROP POLICY IF EXISTS "Users can insert evidence for own cases" ON public.evidence;
DROP POLICY IF EXISTS "Service role can manage cases" ON public.cases;
DROP POLICY IF EXISTS "Service role can manage evidence" ON public.evidence;

-- Create open policies for public access
CREATE POLICY "Public read cases" ON public.cases FOR SELECT USING (true);
CREATE POLICY "Public insert cases" ON public.cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update cases" ON public.cases FOR UPDATE USING (true);
CREATE POLICY "Public delete cases" ON public.cases FOR DELETE USING (true);

CREATE POLICY "Public read evidence" ON public.evidence FOR SELECT USING (true);
CREATE POLICY "Public insert evidence" ON public.evidence FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update evidence" ON public.evidence FOR UPDATE USING (true);
CREATE POLICY "Public delete evidence" ON public.evidence FOR DELETE USING (true);