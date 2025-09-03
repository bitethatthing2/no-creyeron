-- Fix Security Definer Views
-- This migration addresses security warnings about views with SECURITY DEFINER property

-- First, check if the views exist and drop them if they're unused
-- These views are not being used in the application code but appear in generated types

-- Drop views if they exist (they may be legacy from previous migrations)
DROP VIEW IF EXISTS v_active_conversations;
DROP VIEW IF EXISTS v_user_activity; 
DROP VIEW IF EXISTS v_typing_users;

-- If these views are needed in the future, they should be recreated without SECURITY DEFINER
-- or with proper security considerations. For now, removing them resolves the security warnings.

-- Note: These views were only referenced in generated database types but not used in queries.
-- If needed later, recreate them with proper security model:
-- 
-- CREATE VIEW v_active_conversations AS
-- SELECT ... 
-- (without SECURITY DEFINER unless specifically required for RLS bypass)