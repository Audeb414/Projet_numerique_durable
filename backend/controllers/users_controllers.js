const db = require("../db");

exports.getAllUsers = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const rows = db.all(
    "SELECT id, pseudo, email, ville, role, date_inscription FROM users ORDER BY date_inscription DESC LIMIT ? OFFSET ?",
    [limit, offset]
  );
  res.json({ page, limit, data: rows });
};

exports.getUserById = (req, res) => {
  const row = db.get(
    "SELECT id, pseudo, email, ville, competences, role, date_inscription FROM users WHERE id = ?",
    [req.params.id]
  );
  if (!row) return res.status(404).json({ error: "Utilisateur non trouve" });
  res.json(row);
};

exports.updateUser = (req, res) => {
  const { id } = req.params;
  const { pseudo, ville, competences } = req.body;
  if (!req.session.user) return res.status(401).json({ error: "Acces refuse" });
  if (req.session.user.id !== Number(id) && req.session.user.role !== "admin")
    return res.status(403).json({ error: "Action non autorisee" });

  const result = db.run(
    "UPDATE users SET pseudo = ?, ville = ?, competences = ? WHERE id = ?",
    [pseudo, ville, competences, id]
  );
  if (result.changes === 0) return res.status(404).json({ error: "Utilisateur non trouve" });
  res.json({ message: "Profil mis a jour" });
};

exports.deleteUser = (req, res) => {
  const { id } = req.params;
  if (!req.session.user) return res.status(401).json({ error: "Acces refuse" });
  if (req.session.user.id !== Number(id) && req.session.user.role !== "admin")
    return res.status(403).json({ error: "Action non autorisee" });

  db.run("DELETE FROM repairs WHERE demandeur_id = ?", [id]);
  const result = db.run("DELETE FROM users WHERE id = ?", [id]);
  if (result.changes === 0) return res.status(404).json({ error: "Utilisateur non trouve" });
  res.json({ message: "Utilisateur supprime" });
};
