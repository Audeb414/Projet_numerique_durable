-- ═══════════════════════════════════════════════════════════════════
-- RepairMate — Schéma de base de données SQLite
-- TI616 Numérique Durable — EFREI Paris 2025-2026
-- ═══════════════════════════════════════════════════════════════════

-- ── Table users ─────────────────────────────────────────────────────
-- Gère tous les comptes : étudiants et administrateurs
CREATE TABLE IF NOT EXISTS users (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  pseudo           TEXT    NOT NULL,
  email            TEXT    NOT NULL UNIQUE,
  password_hash    TEXT    NOT NULL,          -- Hashé avec bcryptjs (10 rounds)
  competences      TEXT,                       -- Texte libre, ex: "couture, soudure"
  ville            TEXT,                       -- Localisation approximative
  role             TEXT    NOT NULL DEFAULT 'etudiant'
                           CHECK (role IN ('etudiant', 'admin')),
  date_inscription TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Table repairs ────────────────────────────────────────────────────
-- Entité métier principale : demandes de réparation
CREATE TABLE IF NOT EXISTS repairs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  titre         TEXT    NOT NULL,
  description   TEXT    NOT NULL,
  categorie     TEXT    NOT NULL
                        CHECK (categorie IN ('electronique','velo','textile','autre')),
  statut        TEXT    NOT NULL DEFAULT 'ouverte'
                        CHECK (statut IN ('ouverte','en_cours','resolue')),
  demandeur_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reparateur_id INTEGER          REFERENCES users(id) ON DELETE SET NULL,
  date_creation TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Table messages ───────────────────────────────────────────────────
-- Messagerie privée entre demandeur et réparateur
CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  repair_id  INTEGER NOT NULL REFERENCES repairs(id) ON DELETE CASCADE,
  auteur_id  INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  contenu    TEXT    NOT NULL,
  date_envoi TEXT    NOT NULL DEFAULT (datetime('now')),
  lu         INTEGER NOT NULL DEFAULT 0               -- 0 = non lu, 1 = lu
);

-- ── Table notations ──────────────────────────────────────────────────
-- Système de notation (1-5 étoiles) après résolution
CREATE TABLE IF NOT EXISTS notations (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  repair_id            INTEGER NOT NULL UNIQUE REFERENCES repairs(id) ON DELETE CASCADE,
  notateur_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_destinataire_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note                 INTEGER NOT NULL CHECK (note BETWEEN 1 AND 5),
  commentaire          TEXT,
  date_notation        TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Index pour optimiser les requêtes fréquentes ─────────────────────
CREATE INDEX IF NOT EXISTS idx_repairs_statut      ON repairs(statut);
CREATE INDEX IF NOT EXISTS idx_repairs_categorie   ON repairs(categorie);
CREATE INDEX IF NOT EXISTS idx_repairs_demandeur   ON repairs(demandeur_id);
CREATE INDEX IF NOT EXISTS idx_messages_repair     ON messages(repair_id);
CREATE INDEX IF NOT EXISTS idx_messages_lu         ON messages(lu);
CREATE INDEX IF NOT EXISTS idx_notations_destinataire ON notations(note_destinataire_id);
