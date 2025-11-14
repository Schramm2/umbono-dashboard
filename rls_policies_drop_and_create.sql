-- RLS Policies for MMPED Backend - Drop and Recreate
-- This script drops all existing policies and recreates them
-- Run this if you're updating policies or getting conflicts

-- ============================================
-- DROP ALL EXISTING POLICIES
-- ============================================

-- Models
DROP POLICY IF EXISTS "Admin can SELECT models" ON models;
DROP POLICY IF EXISTS "Admin can INSERT models" ON models;
DROP POLICY IF EXISTS "Admin can UPDATE models" ON models;
DROP POLICY IF EXISTS "Admin can DELETE models" ON models;
DROP POLICY IF EXISTS "Authenticated users can SELECT models" ON models;

-- Prompts
DROP POLICY IF EXISTS "Admin can SELECT prompts" ON prompts;
DROP POLICY IF EXISTS "Admin can INSERT prompts" ON prompts;
DROP POLICY IF EXISTS "Admin can UPDATE prompts" ON prompts;
DROP POLICY IF EXISTS "Admin can DELETE prompts" ON prompts;
DROP POLICY IF EXISTS "Authenticated users can SELECT prompts" ON prompts;
DROP POLICY IF EXISTS "Authenticated users can INSERT prompts" ON prompts;
DROP POLICY IF EXISTS "Authenticated users can UPDATE prompts" ON prompts;
DROP POLICY IF EXISTS "Authenticated users can DELETE prompts" ON prompts;

-- Runs
DROP POLICY IF EXISTS "Admin can SELECT runs" ON runs;
DROP POLICY IF EXISTS "Admin can INSERT runs" ON runs;
DROP POLICY IF EXISTS "Admin can UPDATE runs" ON runs;
DROP POLICY IF EXISTS "Admin can DELETE runs" ON runs;
DROP POLICY IF EXISTS "Authenticated users can SELECT runs" ON runs;
DROP POLICY IF EXISTS "Authenticated users can INSERT runs" ON runs;
DROP POLICY IF EXISTS "Authenticated users can UPDATE runs" ON runs;
DROP POLICY IF EXISTS "Authenticated users can DELETE runs" ON runs;

-- Outputs
DROP POLICY IF EXISTS "Admin can SELECT outputs" ON outputs;
DROP POLICY IF EXISTS "Admin can INSERT outputs" ON outputs;
DROP POLICY IF EXISTS "Admin can UPDATE outputs" ON outputs;
DROP POLICY IF EXISTS "Admin can DELETE outputs" ON outputs;
DROP POLICY IF EXISTS "Authenticated users can SELECT outputs" ON outputs;
DROP POLICY IF EXISTS "Authenticated users can INSERT outputs" ON outputs;
DROP POLICY IF EXISTS "Authenticated users can UPDATE outputs" ON outputs;
DROP POLICY IF EXISTS "Authenticated users can DELETE outputs" ON outputs;

-- Evaluation Criteria
DROP POLICY IF EXISTS "Admin can SELECT evaluation_criteria" ON evaluation_criteria;
DROP POLICY IF EXISTS "Admin can INSERT evaluation_criteria" ON evaluation_criteria;
DROP POLICY IF EXISTS "Admin can UPDATE evaluation_criteria" ON evaluation_criteria;
DROP POLICY IF EXISTS "Admin can DELETE evaluation_criteria" ON evaluation_criteria;
DROP POLICY IF EXISTS "Authenticated users can SELECT evaluation_criteria" ON evaluation_criteria;
DROP POLICY IF EXISTS "Authenticated users can INSERT evaluation_criteria" ON evaluation_criteria;
DROP POLICY IF EXISTS "Authenticated users can UPDATE evaluation_criteria" ON evaluation_criteria;
DROP POLICY IF EXISTS "Authenticated users can DELETE evaluation_criteria" ON evaluation_criteria;

-- Ratings
DROP POLICY IF EXISTS "Admin can SELECT ratings" ON ratings;
DROP POLICY IF EXISTS "Admin can INSERT ratings" ON ratings;
DROP POLICY IF EXISTS "Admin can UPDATE ratings" ON ratings;
DROP POLICY IF EXISTS "Admin can DELETE ratings" ON ratings;
DROP POLICY IF EXISTS "Authenticated users can SELECT ratings" ON ratings;
DROP POLICY IF EXISTS "Authenticated users can INSERT ratings" ON ratings;
DROP POLICY IF EXISTS "Authenticated users can UPDATE ratings" ON ratings;
DROP POLICY IF EXISTS "Authenticated users can DELETE ratings" ON ratings;

-- Eval Sets
DROP POLICY IF EXISTS "Admin can SELECT eval_sets" ON eval_sets;
DROP POLICY IF EXISTS "Admin can INSERT eval_sets" ON eval_sets;
DROP POLICY IF EXISTS "Admin can UPDATE eval_sets" ON eval_sets;
DROP POLICY IF EXISTS "Admin can DELETE eval_sets" ON eval_sets;
DROP POLICY IF EXISTS "Authenticated users can SELECT eval_sets" ON eval_sets;
DROP POLICY IF EXISTS "Authenticated users can INSERT eval_sets" ON eval_sets;
DROP POLICY IF EXISTS "Authenticated users can UPDATE eval_sets" ON eval_sets;
DROP POLICY IF EXISTS "Authenticated users can DELETE eval_sets" ON eval_sets;

-- Eval Set Prompts
DROP POLICY IF EXISTS "Admin can SELECT eval_set_prompts" ON eval_set_prompts;
DROP POLICY IF EXISTS "Admin can INSERT eval_set_prompts" ON eval_set_prompts;
DROP POLICY IF EXISTS "Admin can UPDATE eval_set_prompts" ON eval_set_prompts;
DROP POLICY IF EXISTS "Admin can DELETE eval_set_prompts" ON eval_set_prompts;
DROP POLICY IF EXISTS "Authenticated users can SELECT eval_set_prompts" ON eval_set_prompts;
DROP POLICY IF EXISTS "Authenticated users can INSERT eval_set_prompts" ON eval_set_prompts;
DROP POLICY IF EXISTS "Authenticated users can UPDATE eval_set_prompts" ON eval_set_prompts;
DROP POLICY IF EXISTS "Authenticated users can DELETE eval_set_prompts" ON eval_set_prompts;

-- Profiles
DROP POLICY IF EXISTS "Admin can SELECT profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can INSERT profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can UPDATE profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can DELETE profiles" ON profiles;
DROP POLICY IF EXISTS "Users can SELECT own profile" ON profiles;
DROP POLICY IF EXISTS "Users can UPDATE own profile" ON profiles;

-- ============================================
-- NOW RUN THE MAIN rls_policies.sql FILE
-- ============================================

