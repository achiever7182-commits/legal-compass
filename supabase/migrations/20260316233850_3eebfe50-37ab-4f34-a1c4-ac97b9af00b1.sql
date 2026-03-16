
-- Create cases table
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  case_type TEXT,
  priority TEXT CHECK (priority IN ('High', 'Medium', 'Low')),
  legal_strategy TEXT,
  win_probability INTEGER CHECK (win_probability >= 0 AND win_probability <= 100),
  relevant_laws JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evidence table
CREATE TABLE public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  strength TEXT CHECK (strength IN ('Strong', 'Medium', 'Weak')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

-- Public read/write for now (no auth required for demo)
CREATE POLICY "Allow public read cases" ON public.cases FOR SELECT USING (true);
CREATE POLICY "Allow public insert cases" ON public.cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update cases" ON public.cases FOR UPDATE USING (true);
CREATE POLICY "Allow public delete cases" ON public.cases FOR DELETE USING (true);

CREATE POLICY "Allow public read evidence" ON public.evidence FOR SELECT USING (true);
CREATE POLICY "Allow public insert evidence" ON public.evidence FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete evidence" ON public.evidence FOR DELETE USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
