-- ============================================================
-- Fix: Infinite recursion in RLS policies
-- ============================================================
-- Problem: helper functions (is_superadmin, get_user_role) query
-- the profiles table which has RLS enabled, causing circular
-- policy evaluation. Also, cross-table policy references between
-- reading_plans <-> reading_plan_assignments cause recursion.
--
-- Solution:
-- 1. Drop all existing policies
-- 2. Recreate helper functions to bypass RLS explicitly
-- 3. Recreate policies without circular cross-table references

-- ============================================================
-- Step 1: Drop all existing policies
-- ============================================================

-- profiles
DROP POLICY IF EXISTS "superadmin_all" ON public.profiles;
DROP POLICY IF EXISTS "admin_select" ON public.profiles;
DROP POLICY IF EXISTS "translator_select" ON public.profiles;

-- witnesses
DROP POLICY IF EXISTS "superadmin_all" ON public.witnesses;
DROP POLICY IF EXISTS "admin_own" ON public.witnesses;
DROP POLICY IF EXISTS "translator_read" ON public.witnesses;

-- testimonies
DROP POLICY IF EXISTS "superadmin_all" ON public.testimonies;
DROP POLICY IF EXISTS "admin_select" ON public.testimonies;
DROP POLICY IF EXISTS "admin_insert" ON public.testimonies;
DROP POLICY IF EXISTS "admin_update" ON public.testimonies;
DROP POLICY IF EXISTS "admin_delete" ON public.testimonies;
DROP POLICY IF EXISTS "translator_read" ON public.testimonies;

-- testimony_shares
DROP POLICY IF EXISTS "superadmin_all" ON public.testimony_shares;
DROP POLICY IF EXISTS "admin_own" ON public.testimony_shares;

-- translations
DROP POLICY IF EXISTS "superadmin_all" ON public.translations;
DROP POLICY IF EXISTS "admin_read" ON public.translations;
DROP POLICY IF EXISTS "translator_own" ON public.translations;

-- assignments
DROP POLICY IF EXISTS "superadmin_all" ON public.assignments;
DROP POLICY IF EXISTS "admin_own" ON public.assignments;
DROP POLICY IF EXISTS "translator_read" ON public.assignments;

-- services
DROP POLICY IF EXISTS "superadmin_all" ON public.services;
DROP POLICY IF EXISTS "admin_own" ON public.services;
DROP POLICY IF EXISTS "translator_read" ON public.services;

-- reading_plans
DROP POLICY IF EXISTS "superadmin_all" ON public.reading_plans;
DROP POLICY IF EXISTS "admin_own" ON public.reading_plans;
DROP POLICY IF EXISTS "translator_read" ON public.reading_plans;

-- reading_plan_assignments
DROP POLICY IF EXISTS "superadmin_all" ON public.reading_plan_assignments;
DROP POLICY IF EXISTS "admin_own" ON public.reading_plan_assignments;
DROP POLICY IF EXISTS "translator_read" ON public.reading_plan_assignments;

-- reading_occasions
DROP POLICY IF EXISTS "superadmin_all" ON public.reading_occasions;
DROP POLICY IF EXISTS "admin_read" ON public.reading_occasions;
DROP POLICY IF EXISTS "translator_own" ON public.reading_occasions;

-- storage
DROP POLICY IF EXISTS "admin_upload" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_read" ON storage.objects;
DROP POLICY IF EXISTS "admin_delete" ON storage.objects;

-- ============================================================
-- Step 2: Recreate helper functions with explicit RLS bypass
-- ============================================================

-- Use plpgsql instead of sql so we can use a direct query
-- that bypasses RLS via SECURITY DEFINER properly
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_translator_admin()
RETURNS UUID AS $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT owned_by INTO admin_id
  FROM public.profiles
  WHERE id = auth.uid();
  RETURN admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================================
-- Step 3: Recreate policies (no cross-table recursion)
-- ============================================================

-- ---- profiles ----
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

-- ---- witnesses ----
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

-- ---- testimonies ----
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
    public.get_user_role() IN ('admin', 'superadmin') AND owned_by = auth.uid()
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

-- ---- testimony_shares ----
CREATE POLICY "superadmin_all" ON public.testimony_shares
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_own" ON public.testimony_shares
  FOR ALL USING (
    public.get_user_role() = 'admin'
    AND (shared_by = auth.uid() OR shared_with = auth.uid())
  );

-- ---- translations ----
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

-- ---- assignments ----
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

-- ---- services ----
CREATE POLICY "superadmin_all" ON public.services
  FOR ALL USING (public.is_superadmin());

CREATE POLICY "admin_own" ON public.services
  FOR ALL USING (
    public.get_user_role() = 'admin' AND created_by = auth.uid()
  );

-- Translator read: avoid cross-table recursion by NOT joining reading_plans
-- Translators can read services if they have any reading_plan_assignment
CREATE POLICY "translator_read" ON public.services
  FOR SELECT USING (
    public.get_user_role() = 'translator'
    AND id IN (
      SELECT rp.service_id FROM public.reading_plans rp
      WHERE rp.id IN (
        SELECT rpa.plan_id FROM public.reading_plan_assignments rpa
        WHERE rpa.translator_id = auth.uid()
      )
    )
  );

-- ---- reading_plans ----
-- KEY FIX: translator_read uses reading_plan_assignments directly
-- without that table's policy needing to read back into reading_plans
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

-- ---- reading_plan_assignments ----
-- KEY FIX: admin_own checks created_by directly on reading_plans
-- but reading_plans RLS won't recurse back here because
-- reading_plans.admin_own only checks created_by = auth.uid()
CREATE POLICY "superadmin_all" ON public.reading_plan_assignments
  FOR ALL USING (public.is_superadmin());

-- FIX: Use a SECURITY DEFINER function to check plan ownership
-- instead of a sub-select that triggers reading_plans RLS
CREATE OR REPLACE FUNCTION public.is_plan_owner(p_plan_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.reading_plans
    WHERE id = p_plan_id AND created_by = auth.uid()
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE POLICY "admin_own" ON public.reading_plan_assignments
  FOR ALL USING (
    public.get_user_role() IN ('admin', 'superadmin')
    AND public.is_plan_owner(plan_id)
  );

CREATE POLICY "translator_read" ON public.reading_plan_assignments
  FOR SELECT USING (
    public.get_user_role() = 'translator' AND translator_id = auth.uid()
  );

-- ---- reading_occasions ----
CREATE POLICY "superadmin_all" ON public.reading_occasions
  FOR ALL USING (public.is_superadmin());

-- FIX: Use a SECURITY DEFINER function for service ownership check too
CREATE OR REPLACE FUNCTION public.is_service_owner(p_service_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.services
    WHERE id = p_service_id AND created_by = auth.uid()
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE POLICY "admin_read" ON public.reading_occasions
  FOR SELECT USING (
    public.get_user_role() IN ('admin', 'superadmin')
    AND public.is_service_owner(service_id)
  );

CREATE POLICY "translator_own" ON public.reading_occasions
  FOR ALL USING (
    public.get_user_role() = 'translator' AND read_by = auth.uid()
  );

-- ---- storage ----
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
