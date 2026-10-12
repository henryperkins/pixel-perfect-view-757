-- OAuth clients get Pattern data only through the permission-checked MCP tools.
-- Preserve the legacy owner/admin policies and compose this restrictive guard
-- with them. Direct sign-ins and service-role operations keep their existing rights.
BEGIN;
DO $migration$
DECLARE
  member_table text;
BEGIN
  FOREACH member_table IN ARRAY ARRAY[
    'audit_events', 'birth_profiles', 'chart_snapshots', 'check_ins',
    'content_releases', 'context_signals', 'cycle_instances', 'daily_readings',
    'life_events', 'natal_features', 'profiles', 'reading_feedback',
    'reading_sources', 'source_consents', 'user_roles'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = member_table AND c.relrowsecurity
    ) THEN
      RAISE EXCEPTION 'Expected RLS-enabled member table public.%', member_table;
    END IF;
    EXECUTE format(
      'CREATE POLICY deny_delegated_oauth ON public.%I AS RESTRICTIVE FOR ALL TO authenticated
       USING (NOT ((SELECT auth.jwt()) ?| ARRAY[''client_id'', ''azp'']))
       WITH CHECK (NOT ((SELECT auth.jwt()) ?| ARRAY[''client_id'', ''azp'']))',
      member_table
    );
  END LOOP;
END
$migration$;
COMMIT;
