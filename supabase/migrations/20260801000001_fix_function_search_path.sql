-- Fixe le search_path des fonctions trigger pour éviter le détournement de schéma
-- (avertissement "Function Search Path Mutable" du linter Supabase).
ALTER FUNCTION public.assign_user_number() SET search_path = public, pg_temp;
ALTER FUNCTION public.renumber_users_after_delete() SET search_path = public, pg_temp;
