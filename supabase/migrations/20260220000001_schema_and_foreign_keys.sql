-- ============================================================
-- HistoryVoice — Schéma complet + Foreign Keys
-- Migration : 20260220000001
-- ============================================================
-- Ce fichier documente le schéma existant et ajoute les FK
-- manquantes entre les tables.
-- ============================================================


-- ============================================================
-- TABLE : users
-- Utilisateurs de l'app (synchronisés depuis Supabase Auth)
-- ============================================================
-- CREATE TABLE IF NOT EXISTS users (
--   uid               TEXT PRIMARY KEY,         -- = auth.users.id
--   email             TEXT UNIQUE NOT NULL,
--   user_number       SERIAL,                   -- numéro séquentiel d'inscription
--   credits_secondes  INTEGER NOT NULL DEFAULT 0,
--   plan_type         TEXT NOT NULL DEFAULT 'free',
--   stories_count     INTEGER NOT NULL DEFAULT 0,
--   stories_total_seconds  INTEGER NOT NULL DEFAULT 0,
--   stories_avg_seconds    INTEGER NOT NULL DEFAULT 0,
--   tokens_total      INTEGER NOT NULL DEFAULT 0,
--   tts_chars_total   INTEGER NOT NULL DEFAULT 0,
--   created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );


-- ============================================================
-- TABLE : purchases
-- Achats de crédits via RevenueCat (webhook handle-payment)
-- ============================================================
-- CREATE TABLE IF NOT EXISTS purchases (
--   id            BIGSERIAL PRIMARY KEY,
--   uid           TEXT NOT NULL,               -- → users.uid
--   email         TEXT,
--   product_id    TEXT NOT NULL,               -- ex: starter_10min, standard_25min, premium_60min
--   credits_added INTEGER NOT NULL,            -- secondes ajoutées
--   amount_usd    NUMERIC(10, 2),
--   currency      TEXT NOT NULL DEFAULT 'USD',
--   created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );


-- ============================================================
-- TABLE : usage_logs
-- Log par génération (tokens Groq + chars TTS)
-- Permet les stats par période dans send-report
-- ============================================================
-- CREATE TABLE IF NOT EXISTS usage_logs (
--   id         BIGSERIAL PRIMARY KEY,
--   uid        TEXT NOT NULL,                  -- → users.uid
--   tokens     INTEGER NOT NULL DEFAULT 0,
--   tts_chars  INTEGER NOT NULL DEFAULT 0,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );


-- ============================================================
-- TABLE : ia
-- Clés API des services IA (Groq, Google TTS)
-- type = 'ecrit' → Groq API key
-- type = 'parle' → Google Cloud TTS API key
-- ============================================================
-- CREATE TABLE IF NOT EXISTS ia (
--   id      BIGSERIAL PRIMARY KEY,
--   type    TEXT UNIQUE NOT NULL,              -- 'ecrit' | 'parle'
--   api_key TEXT NOT NULL
-- );


-- ============================================================
-- TABLE : report_snapshots
-- Historique des rapports mensuels envoyés (pour graphes)
-- ============================================================
-- CREATE TABLE IF NOT EXISTS report_snapshots (
--   id             BIGSERIAL PRIMARY KEY,
--   report_type    TEXT NOT NULL,              -- 'monthly'
--   period_label   TEXT,
--   total_users    INTEGER NOT NULL DEFAULT 0,
--   active_users   INTEGER NOT NULL DEFAULT 0,
--   total_stories  INTEGER NOT NULL DEFAULT 0,
--   revenue_period NUMERIC(10, 2) NOT NULL DEFAULT 0,
--   ia_cost_period NUMERIC(10, 4) NOT NULL DEFAULT 0,
--   sent_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );


-- ============================================================
-- FOREIGN KEYS
-- Les tables existent déjà en production — on ajoute
-- uniquement les contraintes manquantes.
-- ============================================================

-- S'assurer que users.uid est bien unique (requis pour FK cible)
-- Si uid est déjà PRIMARY KEY, commenter ces 2 lignes
ALTER TABLE users
  ADD CONSTRAINT users_uid_unique UNIQUE (uid);

-- FK : purchases.uid → users.uid
ALTER TABLE purchases
  ADD CONSTRAINT fk_purchases_users
  FOREIGN KEY (uid)
  REFERENCES users (uid)
  ON DELETE CASCADE          -- si l'utilisateur est supprimé, ses achats aussi
  NOT VALID;                 -- NOT VALID : évite un scan complet de la table en prod

-- FK : usage_logs.uid → users.uid
ALTER TABLE usage_logs
  ADD CONSTRAINT fk_usage_logs_users
  FOREIGN KEY (uid)
  REFERENCES users (uid)
  ON DELETE CASCADE
  NOT VALID;

-- Valider les contraintes en arrière-plan (sans bloquer les écritures)
ALTER TABLE purchases VALIDATE CONSTRAINT fk_purchases_users;
ALTER TABLE usage_logs VALIDATE CONSTRAINT fk_usage_logs_users;


-- ============================================================
-- INDEX utiles (si pas déjà créés)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_purchases_uid       ON purchases   (uid);
CREATE INDEX IF NOT EXISTS idx_purchases_created   ON purchases   (created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_uid      ON usage_logs  (uid);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created  ON usage_logs  (created_at);
CREATE INDEX IF NOT EXISTS idx_report_snap_type    ON report_snapshots (report_type, sent_at);
