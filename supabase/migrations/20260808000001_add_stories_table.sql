CREATE TABLE IF NOT EXISTS stories (
  id BIGSERIAL PRIMARY KEY,
  uid TEXT NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
  texte TEXT NOT NULL,
  audio_path TEXT NOT NULL,
  age INTEGER,
  age_label TEXT,
  sexe TEXT,
  genre TEXT,
  moment TEXT,
  duree_secondes INTEGER,
  langue_id TEXT,
  voix_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stories_uid ON stories(uid);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all public access" ON public.stories FOR ALL TO public USING (false) WITH CHECK (false);
