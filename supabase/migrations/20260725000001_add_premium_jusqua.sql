-- ============================================================
-- HistoryVoice — Statut premium (suppression des pubs)
-- Migration : 20260725000001
-- ============================================================
-- Un achat de pack de crédits déclenche N jours de statut premium
-- (zéro pub), cumulables : starter=+30j, standard=+60j, premium=+90j.
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS premium_jusqua TIMESTAMPTZ;
