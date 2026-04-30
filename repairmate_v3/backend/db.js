const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const DB_PATH = path.join(__dirname, "..", "database", "repairmate.db");

class Database {
  constructor() {
    this._db = null;
    this._ready = false;
  }

  async init() {
    const SQL = await initSqlJs();
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      this._db = new SQL.Database(fileBuffer);
      console.log("Base SQLite chargee depuis", DB_PATH);
    } else {
      this._db = new SQL.Database();
      console.log("Nouvelle base SQLite creee");
    }
    this._createTables();
    await this._seedAdmin();
    this._ready = true;
  }

  _save() {
    const data = this._db.export();
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }

  _createTables() {
    this._db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pseudo TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      competences TEXT,
      ville TEXT,
      role TEXT NOT NULL DEFAULT 'etudiant',
      date_inscription TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
    this._db.run(`CREATE TABLE IF NOT EXISTS repairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titre TEXT NOT NULL,
      description TEXT NOT NULL,
      categorie TEXT NOT NULL,
      statut TEXT NOT NULL DEFAULT 'ouverte',
      demandeur_id INTEGER NOT NULL,
      reparateur_id INTEGER,
      date_creation TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
    this._db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repair_id INTEGER NOT NULL,
      auteur_id INTEGER NOT NULL,
      contenu TEXT NOT NULL,
      date_envoi TEXT NOT NULL DEFAULT (datetime('now')),
      lu INTEGER NOT NULL DEFAULT 0
    )`);
    this._db.run(`CREATE TABLE IF NOT EXISTS notations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repair_id INTEGER NOT NULL UNIQUE,
      notateur_id INTEGER NOT NULL,
      note_destinataire_id INTEGER NOT NULL,
      note INTEGER NOT NULL,
      commentaire TEXT,
      date_notation TEXT NOT NULL DEFAULT (datetime('now'))
    )`);
    this._save();
  }

  // Crée le compte admin au premier démarrage si inexistant
  async _seedAdmin() {
    const existing = this.get("SELECT id FROM users WHERE role = 'admin'");
    if (existing) return;

    const hash = await bcrypt.hash("admin1234", 10);
    this.run(
      "INSERT INTO users (pseudo, email, password_hash, ville, role) VALUES (?, ?, ?, ?, 'admin')",
      ["Administrateur", "admin@repairmate.fr", hash, "Paris"]
    );
    console.log("┌─────────────────────────────────────────┐");
    console.log("│  Compte administrateur créé :           │");
    console.log("│  Email    : admin@repairmate.fr         │");
    console.log("│  Password : admin1234                   │");
    console.log("│  ⚠ Changez ce mot de passe en prod !   │");
    console.log("└─────────────────────────────────────────┘");
  }

  run(sql, params = []) {
    this._db.run(sql, params);
    this._save();
    try {
      const r = this._db.exec("SELECT last_insert_rowid()");
      return { lastID: r[0]?.values[0][0] || 0, changes: 1 };
    } catch {
      return { lastID: 0, changes: 0 };
    }
  }

  get(sql, params = []) {
    const stmt = this._db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  }

  all(sql, params = []) {
    const result = this._db.exec(sql, params);
    if (!result.length) return [];
    const { columns, values } = result[0];
    return values.map(row => Object.fromEntries(columns.map((col, i) => [col, row[i]])));
  }
}

const db = new Database();
module.exports = db;
