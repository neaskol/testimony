-- ============================================================
-- TémoinApp — Migration initiale
-- ============================================================

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'translator')),
  owned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_owned_by ON public.profiles(owned_by);

CREATE TABLE public.witnesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  language_preference TEXT NOT NULL DEFAULT 'fr' CHECK (language_preference IN ('mg', 'fr')),
  color_tag TEXT CHECK (color_tag IN ('blue', 'green', 'red', 'yellow', 'purple')),
  label TEXT,
  private_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_witnesses_created_by ON public.witnesses(created_by);

CREATE TABLE public.testimonies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  witness_id UUID REFERENCES public.witnesses(id) ON DELETE SET NULL,
  content TEXT,
  audio_url TEXT,
  source_language TEXT NOT NULL DEFAULT 'fr' CHECK (source_language IN ('mg', 'fr')),
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'in_translation', 'translated', 'planned', 'read')),
  tags TEXT[] DEFAULT '{}',
  private_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_testimonies_owned_by ON public.testimonies(owned_by);
CREATE INDEX idx_testimonies_witness_id ON public.testimonies(witness_id);
CREATE INDEX idx_testimonies_status ON public.testimonies(status);

CREATE TABLE public.testimony_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimony_id UUID NOT NULL REFERENCES public.testimonies(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(testimony_id, shared_with)
);

CREATE INDEX idx_testimony_shares_shared_with ON public.testimony_shares(shared_with);

CREATE TABLE public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimony_id UUID NOT NULL REFERENCES public.testimonies(id) ON DELETE CASCADE,
  translator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  target_language TEXT NOT NULL CHECK (target_language IN ('mg', 'fr')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_translations_testimony_id ON public.translations(testimony_id);
CREATE INDEX idx_translations_translator_id ON public.translations(translator_id);

CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimony_id UUID NOT NULL REFERENCES public.testimonies(id) ON DELETE CASCADE,
  translator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(testimony_id, translator_id)
);

CREATE INDEX idx_assignments_translator_id ON public.assignments(translator_id);

CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT,
  inspiration TEXT,
  scriptures TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_created_by ON public.services(created_by);
CREATE INDEX idx_services_service_date ON public.services(service_date);

CREATE TABLE public.reading_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  testimony_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reading_plans_service_id ON public.reading_plans(service_id);
CREATE INDEX idx_reading_plans_created_by ON public.reading_plans(created_by);

CREATE TABLE public.reading_plan_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
  translator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(plan_id, translator_id)
);

CREATE INDEX idx_rpa_translator_id ON public.reading_plan_assignments(translator_id);

CREATE TABLE public.reading_occasions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimony_id UUID NOT NULL REFERENCES public.testimonies(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
  read_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('read', 'skipped')),
  read_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reading_occasions_testimony_id ON public.reading_occasions(testimony_id);
CREATE INDEX idx_reading_occasions_service_id ON public.reading_occasions(service_id);
CREATE INDEX idx_reading_occasions_plan_id ON public.reading_occasions(plan_id);

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-create profile on auth.users creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'translator')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.witnesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.testimonies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.reading_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- RLS Helper Functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_translator_admin()
RETURNS UUID AS $$
  SELECT owned_by FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- RLS Policies
-- ============================================================

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.profiles
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_select" ON public.profiles
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    AND (id = auth.uid() OR owned_by = auth.uid())
  );

CREATE POLICY "translator_select" ON public.profiles
  FOR SELECT USING (
    public.get_user_role() = 'translator' AND id = auth.uid()
  );

-- witnesses
ALTER TABLE public.witnesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.witnesses
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_own" ON public.witnesses
  FOR ALL USING (
    public.get_user_role() = 'admin' AND created_by = auth.uid()
  );

CREATE POLICY "translator_read" ON public.witnesses
  FOR SELECT USING (
    public.get_user_role() = 'translator'
    AND id IN (
      SELECT t.witness_id FROM public.testimonies t
      INNER JOIN public.assignments a ON a.testimony_id = t.id
      WHERE a.translator_id = auth.uid()
    )
  );

-- testimonies
ALTER TABLE public.testimonies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.testimonies
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_select" ON public.testimonies
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    AND (
      owned_by = auth.uid()
      OR id IN (
        SELECT testimony_id FROM public.testimony_shares
        WHERE shared_with = auth.uid()
      )
    )
  );

CREATE POLICY "admin_insert" ON public.testimonies
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'admin' AND owned_by = auth.uid()
  );

CREATE POLICY "admin_update" ON public.testimonies
  FOR UPDATE USING (
    public.get_user_role() = 'admin' AND owned_by = auth.uid()
  );

CREATE POLICY "admin_delete" ON public.testimonies
  FOR DELETE USING (
    public.get_user_role() = 'admin' AND owned_by = auth.uid()
  );

CREATE POLICY "translator_read" ON public.testimonies
  FOR SELECT USING (
    public.get_user_role() = 'translator'
    AND id IN (
      SELECT testimony_id FROM public.assignments
      WHERE translator_id = auth.uid()
    )
  );

-- testimony_shares
ALTER TABLE public.testimony_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.testimony_shares
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_own" ON public.testimony_shares
  FOR ALL USING (
    public.get_user_role() = 'admin'
    AND (shared_by = auth.uid() OR shared_with = auth.uid())
  );

-- translations
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.translations
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_read" ON public.translations
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    AND testimony_id IN (
      SELECT id FROM public.testimonies WHERE owned_by = auth.uid()
    )
  );

CREATE POLICY "translator_own" ON public.translations
  FOR ALL USING (
    public.get_user_role() = 'translator'
    AND translator_id = auth.uid()
  );

-- assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.assignments
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_own" ON public.assignments
  FOR ALL USING (
    public.get_user_role() = 'admin' AND assigned_by = auth.uid()
  );

CREATE POLICY "translator_read" ON public.assignments
  FOR SELECT USING (
    public.get_user_role() = 'translator' AND translator_id = auth.uid()
  );

-- services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.services
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_own" ON public.services
  FOR ALL USING (
    public.get_user_role() = 'admin' AND created_by = auth.uid()
  );

CREATE POLICY "translator_read" ON public.services
  FOR SELECT USING (
    public.get_user_role() = 'translator'
    AND id IN (
      SELECT rp.service_id FROM public.reading_plans rp
      INNER JOIN public.reading_plan_assignments rpa ON rpa.plan_id = rp.id
      WHERE rpa.translator_id = auth.uid()
    )
  );

-- reading_plans
ALTER TABLE public.reading_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.reading_plans
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_own" ON public.reading_plans
  FOR ALL USING (
    public.get_user_role() = 'admin' AND created_by = auth.uid()
  );

CREATE POLICY "translator_read" ON public.reading_plans
  FOR SELECT USING (
    public.get_user_role() = 'translator'
    AND id IN (
      SELECT plan_id FROM public.reading_plan_assignments
      WHERE translator_id = auth.uid()
    )
  );

-- reading_plan_assignments
ALTER TABLE public.reading_plan_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.reading_plan_assignments
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_own" ON public.reading_plan_assignments
  FOR ALL USING (
    public.get_user_role() = 'admin'
    AND plan_id IN (
      SELECT id FROM public.reading_plans WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "translator_read" ON public.reading_plan_assignments
  FOR SELECT USING (
    public.get_user_role() = 'translator' AND translator_id = auth.uid()
  );

-- reading_occasions
ALTER TABLE public.reading_occasions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.reading_occasions
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_read" ON public.reading_occasions
  FOR SELECT USING (
    public.get_user_role() = 'admin'
    AND service_id IN (
      SELECT id FROM public.services WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "translator_own" ON public.reading_occasions
  FOR ALL USING (
    public.get_user_role() = 'translator' AND read_by = auth.uid()
  );

-- ============================================================
-- Storage : bucket audio
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('audio', 'audio', false);

CREATE POLICY "admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'audio'
    AND (public.get_user_role() IN ('admin', 'superadmin'))
  );

CREATE POLICY "authenticated_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'audio'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'audio'
    AND (public.get_user_role() IN ('admin', 'superadmin'))
  );
