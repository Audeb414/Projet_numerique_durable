const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "repairmate.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // ─── Table users ──────────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      pseudo           TEXT    NOT NULL,
      email            TEXT    NOT NULL UNIQUE,
      password_hash    TEXT    NOT NULL,
      competences      TEXT,
      ville            TEXT,
      role             TEXT    NOT NULL DEFAULT 'etudiant',
      date_inscription DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ─── Table repairs ────────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS repairs (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      titre         TEXT    NOT NULL,
      description   TEXT    NOT NULL,
      categorie     TEXT    NOT NULL CHECK(categorie IN ('electronique','velo','textile','autre')),
      statut        TEXT    NOT NULL DEFAULT 'ouverte' CHECK(statut IN ('ouverte','en_cours','resolue')),
      demandeur_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reparateur_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ─── Données de test ──────────────────────────────────────────────────────
  const adminEmail = "admin@repairmate.fr";
  db.get("SELECT id FROM users WHERE email = ?", [adminEmail], async (err, row) => {
    if (row) return; // déjà initialisé

    const adminHash = await bcrypt.hash("admin1234", 10);
    const userHash  = await bcrypt.hash("user1234", 10);

    db.run(
      `INSERT INTO users (pseudo, email, password_hash, competences, ville, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["Admin", adminEmail, adminHash, "Administration", "Paris", "admin"]
    );

    db.run(
      `INSERT INTO users (pseudo, email, password_hash, competences, ville, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["Alice", "alice@example.com", userHash, "Couture, textile, vêtements", "Lyon", "etudiant"],
      function () {
        const aliceId = this.lastID;
        db.run(
          `INSERT INTO repairs (titre, description, categorie, demandeur_id)
           VALUES (?, ?, ?, ?)`,
          ["Jeans déchiré au genou", "Mon jean préféré a une déchirure au genou gauche, besoin d'une réparation discrète.", "textile", aliceId]
        );
      }
    );

    db.run(
      `INSERT INTO users (pseudo, email, password_hash, competences, ville, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["Bob", "bob@example.com", userHash, "Électronique, soudure, Arduino", "Paris", "etudiant"],
      function () {
        const bobId = this.lastID;
        db.run(
          `INSERT INTO repairs (titre, description, categorie, demandeur_id)
           VALUES (?, ?, ?, ?)`,
          ["Écran de téléphone fissuré", "L'écran de mon Samsung A52 est fissuré, il fonctionne encore mais il faut le remplacer.", "electronique", bobId]
        );
        db.run(
          `INSERT INTO repairs (titre, description, categorie, demandeur_id)
           VALUES (?, ?, ?, ?)`,
          ["Dérailleur vélo bloqué", "Mon dérailleur arrière ne passe plus les vitesses correctement depuis une chute.", "velo", bobId]
        );
      }
    );

    console.log("✅ Base de données initialisée avec des données de test.");
    console.log("   → Admin : admin@repairmate.fr / admin1234");
    console.log("   → Alice : alice@example.com  / user1234");
    console.log("   → Bob   : bob@example.com    / user1234");
  });
});

db.close();
