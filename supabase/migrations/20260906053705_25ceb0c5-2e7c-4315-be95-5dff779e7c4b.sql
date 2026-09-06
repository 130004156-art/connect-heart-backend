
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student','college_admin','recruiter')),
  college_name text,
  skills text[] NOT NULL DEFAULT '{}',
  target_role text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  company_name text NOT NULL,
  description text,
  required_skills text[] NOT NULL DEFAULT '{}',
  stipend text,
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT SELECT ON public.opportunities TO anon;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opportunities public read" ON public.opportunities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "recruiters insert own opportunities" ON public.opportunities FOR INSERT TO authenticated WITH CHECK (auth.uid() = recruiter_id);
CREATE POLICY "recruiters update own opportunities" ON public.opportunities FOR UPDATE TO authenticated USING (auth.uid() = recruiter_id) WITH CHECK (auth.uid() = recruiter_id);
CREATE POLICY "recruiters delete own opportunities" ON public.opportunities FOR DELETE TO authenticated USING (auth.uid() = recruiter_id);

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_score numeric(5,2),
  status text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','reviewing','shortlisted','rejected')),
  applied_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students read own applications" ON public.applications FOR SELECT TO authenticated
  USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = job_id AND o.recruiter_id = auth.uid()));
CREATE POLICY "students apply" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "recruiters update application status" ON public.applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = job_id AND o.recruiter_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = job_id AND o.recruiter_id = auth.uid()));
CREATE POLICY "students withdraw" ON public.applications FOR DELETE TO authenticated USING (auth.uid() = student_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, college_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'college_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.opportunities (title, company_name, description, required_skills, stipend, location) VALUES
('Frontend Engineering Intern', 'Nimbus Labs', 'Build accessible dashboards for our analytics suite.', ARRAY['React','TypeScript','Tailwind CSS','REST APIs'], '₹35,000/month', 'Bengaluru (Hybrid)'),
('Data Analyst Intern', 'Vayu Analytics', 'Turn messy operational data into decision-ready dashboards.', ARRAY['SQL','Python','Pandas','Data Visualization'], '₹28,000/month', 'Remote'),
('Backend Developer Trainee', 'Corewave Systems', 'Ship APIs for a high-volume logistics platform.', ARRAY['Node.js','PostgreSQL','Docker','REST APIs'], '₹40,000/month', 'Pune'),
('ML Research Intern', 'Anveshan AI', 'Prototype retrieval-augmented models for Indic languages.', ARRAY['Python','Machine Learning','PyTorch','Statistics'], '₹45,000/month', 'Hyderabad'),
('Cloud Infrastructure Intern', 'Skyforge Cloud', 'Automate deployments across multi-region clusters.', ARRAY['AWS','Docker','Kubernetes','Linux'], '₹38,000/month', 'Chennai (Hybrid)'),
('Product Design Intern', 'Kalpa Studio', 'Design onboarding flows for a fintech super-app.', ARRAY['Figma','UI Design','User Research','Prototyping'], '₹25,000/month', 'Mumbai');
