-- RLS Policies for MMPED Backend
-- Admin users can do everything (SELECT, INSERT, UPDATE, DELETE) on all tables
--
-- IMPORTANT: Before applying these policies, ensure:
-- 1. All existing policies are dropped (use DROP POLICY IF EXISTS)
-- 2. The profiles table exists and has a 'role' column
-- 3. API routes use authenticated Supabase clients with user tokens
--
-- To drop existing policies (run this first if updating):
-- DROP POLICY IF EXISTS "Admin can SELECT eval_sets" ON eval_sets;
-- DROP POLICY IF EXISTS "Admin can INSERT eval_sets" ON eval_sets;
-- DROP POLICY IF EXISTS "Admin can UPDATE eval_sets" ON eval_sets;
-- DROP POLICY IF EXISTS "Admin can DELETE eval_sets" ON eval_sets;
-- DROP POLICY IF EXISTS "Authenticated users can SELECT eval_sets" ON eval_sets;
-- DROP POLICY IF EXISTS "Authenticated users can INSERT eval_sets" ON eval_sets;
-- DROP POLICY IF EXISTS "Authenticated users can UPDATE eval_sets" ON eval_sets;
-- DROP POLICY IF EXISTS "Authenticated users can DELETE eval_sets" ON eval_sets;

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE eval_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE eval_set_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- MODELS TABLE POLICIES
-- ============================================

-- Admin can SELECT all models
CREATE POLICY "Admin can SELECT models"
ON models FOR SELECT
TO authenticated
USING (is_admin());

-- Admin can INSERT models
CREATE POLICY "Admin can INSERT models"
ON models FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Admin can UPDATE models
CREATE POLICY "Admin can UPDATE models"
ON models FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Admin can DELETE models
CREATE POLICY "Admin can DELETE models"
ON models FOR DELETE
TO authenticated
USING (is_admin());

-- Authenticated users can SELECT all models
CREATE POLICY "Authenticated users can SELECT models"
ON models FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- PROMPTS TABLE POLICIES
-- ============================================

-- Admin can SELECT all prompts
CREATE POLICY "Admin can SELECT prompts"
ON prompts FOR SELECT
TO authenticated
USING (is_admin());

-- Admin can INSERT prompts
CREATE POLICY "Admin can INSERT prompts"
ON prompts FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Admin can UPDATE prompts
CREATE POLICY "Admin can UPDATE prompts"
ON prompts FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Admin can DELETE prompts
CREATE POLICY "Admin can DELETE prompts"
ON prompts FOR DELETE
TO authenticated
USING (is_admin());

-- Authenticated users can SELECT all prompts
CREATE POLICY "Authenticated users can SELECT prompts"
ON prompts FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can INSERT prompts
CREATE POLICY "Authenticated users can INSERT prompts"
ON prompts FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can UPDATE prompts
CREATE POLICY "Authenticated users can UPDATE prompts"
ON prompts FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated users can DELETE prompts
CREATE POLICY "Authenticated users can DELETE prompts"
ON prompts FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- RUNS TABLE POLICIES
-- ============================================

-- Admin can SELECT all runs
CREATE POLICY "Admin can SELECT runs"
ON runs FOR SELECT
TO authenticated
USING (is_admin());

-- Admin can INSERT runs
CREATE POLICY "Admin can INSERT runs"
ON runs FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Admin can UPDATE runs
CREATE POLICY "Admin can UPDATE runs"
ON runs FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Admin can DELETE runs
CREATE POLICY "Admin can DELETE runs"
ON runs FOR DELETE
TO authenticated
USING (is_admin());

-- Authenticated users can SELECT all runs
CREATE POLICY "Authenticated users can SELECT runs"
ON runs FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can INSERT runs
CREATE POLICY "Authenticated users can INSERT runs"
ON runs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can UPDATE runs
CREATE POLICY "Authenticated users can UPDATE runs"
ON runs FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated users can DELETE runs
CREATE POLICY "Authenticated users can DELETE runs"
ON runs FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- OUTPUTS TABLE POLICIES
-- ============================================

-- Admin can SELECT all outputs
CREATE POLICY "Admin can SELECT outputs"
ON outputs FOR SELECT
TO authenticated
USING (is_admin());

-- Admin can INSERT outputs
CREATE POLICY "Admin can INSERT outputs"
ON outputs FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Admin can UPDATE outputs
CREATE POLICY "Admin can UPDATE outputs"
ON outputs FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Admin can DELETE outputs
CREATE POLICY "Admin can DELETE outputs"
ON outputs FOR DELETE
TO authenticated
USING (is_admin());

-- Authenticated users can SELECT all outputs
CREATE POLICY "Authenticated users can SELECT outputs"
ON outputs FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can INSERT outputs
CREATE POLICY "Authenticated users can INSERT outputs"
ON outputs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can UPDATE outputs
CREATE POLICY "Authenticated users can UPDATE outputs"
ON outputs FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated users can DELETE outputs
CREATE POLICY "Authenticated users can DELETE outputs"
ON outputs FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- EVALUATION_CRITERIA TABLE POLICIES
-- ============================================

-- Admin can SELECT all evaluation_criteria
CREATE POLICY "Admin can SELECT evaluation_criteria"
ON evaluation_criteria FOR SELECT
TO authenticated
USING (is_admin());

-- Admin can INSERT evaluation_criteria
CREATE POLICY "Admin can INSERT evaluation_criteria"
ON evaluation_criteria FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Admin can UPDATE evaluation_criteria
CREATE POLICY "Admin can UPDATE evaluation_criteria"
ON evaluation_criteria FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Admin can DELETE evaluation_criteria
CREATE POLICY "Admin can DELETE evaluation_criteria"
ON evaluation_criteria FOR DELETE
TO authenticated
USING (is_admin());

-- Authenticated users can SELECT all evaluation_criteria
CREATE POLICY "Authenticated users can SELECT evaluation_criteria"
ON evaluation_criteria FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can INSERT evaluation_criteria
CREATE POLICY "Authenticated users can INSERT evaluation_criteria"
ON evaluation_criteria FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can UPDATE evaluation_criteria
CREATE POLICY "Authenticated users can UPDATE evaluation_criteria"
ON evaluation_criteria FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated users can DELETE evaluation_criteria
CREATE POLICY "Authenticated users can DELETE evaluation_criteria"
ON evaluation_criteria FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- RATINGS TABLE POLICIES
-- ============================================

-- Admin can SELECT all ratings
CREATE POLICY "Admin can SELECT ratings"
ON ratings FOR SELECT
TO authenticated
USING (is_admin());

-- Admin can INSERT ratings
CREATE POLICY "Admin can INSERT ratings"
ON ratings FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Admin can UPDATE ratings
CREATE POLICY "Admin can UPDATE ratings"
ON ratings FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Admin can DELETE ratings
CREATE POLICY "Admin can DELETE ratings"
ON ratings FOR DELETE
TO authenticated
USING (is_admin());

-- Authenticated users can SELECT all ratings
CREATE POLICY "Authenticated users can SELECT ratings"
ON ratings FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can INSERT ratings
CREATE POLICY "Authenticated users can INSERT ratings"
ON ratings FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can UPDATE ratings
CREATE POLICY "Authenticated users can UPDATE ratings"
ON ratings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated users can DELETE ratings
CREATE POLICY "Authenticated users can DELETE ratings"
ON ratings FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- EVAL_SETS TABLE POLICIES
-- ============================================

-- Admin can SELECT all eval_sets
CREATE POLICY "Admin can SELECT eval_sets"
ON eval_sets FOR SELECT
TO authenticated
USING (is_admin());

-- Admin can INSERT eval_sets
CREATE POLICY "Admin can INSERT eval_sets"
ON eval_sets FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Admin can UPDATE eval_sets
CREATE POLICY "Admin can UPDATE eval_sets"
ON eval_sets FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Admin can DELETE eval_sets
CREATE POLICY "Admin can DELETE eval_sets"
ON eval_sets FOR DELETE
TO authenticated
USING (is_admin());

-- Authenticated users can SELECT all eval_sets
CREATE POLICY "Authenticated users can SELECT eval_sets"
ON eval_sets FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can INSERT eval_sets
CREATE POLICY "Authenticated users can INSERT eval_sets"
ON eval_sets FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can UPDATE eval_sets
CREATE POLICY "Authenticated users can UPDATE eval_sets"
ON eval_sets FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated users can DELETE eval_sets
CREATE POLICY "Authenticated users can DELETE eval_sets"
ON eval_sets FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- EVAL_SET_PROMPTS TABLE POLICIES
-- ============================================

-- Admin can SELECT all eval_set_prompts
CREATE POLICY "Admin can SELECT eval_set_prompts"
ON eval_set_prompts FOR SELECT
TO authenticated
USING (is_admin());

-- Admin can INSERT eval_set_prompts
CREATE POLICY "Admin can INSERT eval_set_prompts"
ON eval_set_prompts FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Admin can UPDATE eval_set_prompts
CREATE POLICY "Admin can UPDATE eval_set_prompts"
ON eval_set_prompts FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Admin can DELETE eval_set_prompts
CREATE POLICY "Admin can DELETE eval_set_prompts"
ON eval_set_prompts FOR DELETE
TO authenticated
USING (is_admin());

-- Authenticated users can SELECT all eval_set_prompts
CREATE POLICY "Authenticated users can SELECT eval_set_prompts"
ON eval_set_prompts FOR SELECT
TO authenticated
USING (true);

-- Authenticated users can INSERT eval_set_prompts
CREATE POLICY "Authenticated users can INSERT eval_set_prompts"
ON eval_set_prompts FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can UPDATE eval_set_prompts
CREATE POLICY "Authenticated users can UPDATE eval_set_prompts"
ON eval_set_prompts FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated users can DELETE eval_set_prompts
CREATE POLICY "Authenticated users can DELETE eval_set_prompts"
ON eval_set_prompts FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Admin can SELECT all profiles
CREATE POLICY "Admin can SELECT profiles"
ON profiles FOR SELECT
TO authenticated
USING (is_admin());

-- Admin can INSERT profiles
CREATE POLICY "Admin can INSERT profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Admin can UPDATE profiles
CREATE POLICY "Admin can UPDATE profiles"
ON profiles FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Admin can DELETE profiles
CREATE POLICY "Admin can DELETE profiles"
ON profiles FOR DELETE
TO authenticated
USING (is_admin());

-- Users can view their own profile
CREATE POLICY "Users can SELECT own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can UPDATE their own profile (but not role)
CREATE POLICY "Users can UPDATE own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (
    -- Admin can change role, regular users cannot
    is_admin() 
    OR 
    -- Regular users can update but role must remain unchanged
    (role = get_user_role())
  )
);

