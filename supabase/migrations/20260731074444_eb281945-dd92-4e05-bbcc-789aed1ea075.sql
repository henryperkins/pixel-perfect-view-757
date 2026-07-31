-- ============ profiles ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  tone_pref TEXT NOT NULL DEFAULT 'plain',
  depth_pref TEXT NOT NULL DEFAULT 'standard',
  wrapped_dek TEXT,
  onboarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NULLIF(NEW.raw_user_meta_data ->> 'display_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ source consents ============
CREATE TABLE public.source_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  tier SMALLINT NOT NULL DEFAULT 1,
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.source_consents TO authenticated;
GRANT ALL ON public.source_consents TO service_role;
ALTER TABLE public.source_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own consents" ON public.source_consents FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER source_consents_updated_at BEFORE UPDATE ON public.source_consents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ birth profiles ============
CREATE TABLE public.birth_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  payload_ct TEXT NOT NULL,
  time_accuracy TEXT NOT NULL DEFAULT 'exact',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.birth_profiles TO authenticated;
GRANT ALL ON public.birth_profiles TO service_role;
ALTER TABLE public.birth_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own birth profile" ON public.birth_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER birth_profiles_updated_at BEFORE UPDATE ON public.birth_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ chart snapshots ============
CREATE TABLE public.chart_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  birth_profile_id UUID NOT NULL REFERENCES public.birth_profiles ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  engine TEXT NOT NULL,
  contract_version TEXT NOT NULL,
  positions JSONB NOT NULL DEFAULT '{}'::jsonb,
  houses JSONB NOT NULL DEFAULT '{}'::jsonb,
  aspects JSONB NOT NULL DEFAULT '[]'::jsonb,
  uncertainty JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, fingerprint)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chart_snapshots TO authenticated;
GRANT ALL ON public.chart_snapshots TO service_role;
ALTER TABLE public.chart_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own snapshots" ON public.chart_snapshots FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ natal features ============
CREATE TABLE public.natal_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  snapshot_id UUID NOT NULL REFERENCES public.chart_snapshots ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  family TEXT NOT NULL,
  title TEXT NOT NULL,
  strength NUMERIC NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX natal_features_snapshot_idx ON public.natal_features (snapshot_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.natal_features TO authenticated;
GRANT ALL ON public.natal_features TO service_role;
ALTER TABLE public.natal_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own features" ON public.natal_features FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ cycle instances ============
CREATE TABLE public.cycle_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  snapshot_id UUID NOT NULL REFERENCES public.chart_snapshots ON DELETE CASCADE,
  cycle_key TEXT NOT NULL,
  transit_body TEXT NOT NULL,
  natal_point TEXT NOT NULL,
  aspect TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'general',
  phase TEXT NOT NULL DEFAULT 'active',
  orb NUMERIC NOT NULL DEFAULT 0,
  importance NUMERIC NOT NULL DEFAULT 0,
  ingress_at TIMESTAMPTZ,
  exact_at TIMESTAMPTZ,
  egress_at TIMESTAMPTZ,
  computed_for DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, cycle_key, computed_for)
);
CREATE INDEX cycle_instances_day_idx ON public.cycle_instances (user_id, computed_for);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycle_instances TO authenticated;
GRANT ALL ON public.cycle_instances TO service_role;
ALTER TABLE public.cycle_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cycles" ON public.cycle_instances FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ context signals ============
CREATE TABLE public.context_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC NOT NULL DEFAULT 0.5,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days')
);
CREATE INDEX context_signals_user_idx ON public.context_signals (user_id, source_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.context_signals TO authenticated;
GRANT ALL ON public.context_signals TO service_role;
ALTER TABLE public.context_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own signals" ON public.context_signals FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ content releases ============
CREATE TABLE public.content_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  checksum TEXT NOT NULL,
  bundle JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.content_releases TO authenticated;
GRANT ALL ON public.content_releases TO service_role;
ALTER TABLE public.content_releases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read active content" ON public.content_releases FOR SELECT TO authenticated
  USING (is_active);

-- ============ daily readings ============
CREATE TABLE public.daily_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  snapshot_id UUID REFERENCES public.chart_snapshots ON DELETE SET NULL,
  release_version TEXT,
  headline TEXT NOT NULL,
  body_ct TEXT NOT NULL,
  prompt TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium',
  primary_cycle_key TEXT,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX daily_readings_user_date_idx ON public.daily_readings (user_id, reading_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_readings TO authenticated;
GRANT ALL ON public.daily_readings TO service_role;
ALTER TABLE public.daily_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own readings" ON public.daily_readings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ reading sources ============
CREATE TABLE public.reading_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  reading_id UUID NOT NULL REFERENCES public.daily_readings ON DELETE CASCADE,
  lane TEXT NOT NULL,
  source_id TEXT NOT NULL,
  label TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX reading_sources_reading_idx ON public.reading_sources (reading_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_sources TO authenticated;
GRANT ALL ON public.reading_sources TO service_role;
ALTER TABLE public.reading_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reading sources" ON public.reading_sources FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ reading feedback ============
CREATE TABLE public.reading_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  reading_id UUID NOT NULL REFERENCES public.daily_readings ON DELETE CASCADE,
  resonance SMALLINT NOT NULL,
  labels TEXT[] NOT NULL DEFAULT '{}',
  note_ct TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, reading_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reading_feedback TO authenticated;
GRANT ALL ON public.reading_feedback TO service_role;
ALTER TABLE public.reading_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own feedback" ON public.reading_feedback FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ check-ins ============
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  day DATE NOT NULL,
  mood SMALLINT,
  energy SMALLINT,
  note_ct TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.check_ins TO authenticated;
GRANT ALL ON public.check_ins TO service_role;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own check ins" ON public.check_ins FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ life events ============
CREATE TABLE public.life_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  occurred_on DATE NOT NULL,
  domain TEXT NOT NULL DEFAULT 'general',
  label_ct TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.life_events TO authenticated;
GRANT ALL ON public.life_events TO service_role;
ALTER TABLE public.life_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own life events" ON public.life_events FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ audit events ============
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  kind TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_events_user_idx ON public.audit_events (user_id, created_at DESC);
GRANT SELECT, INSERT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own audit read" ON public.audit_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "own audit write" ON public.audit_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);