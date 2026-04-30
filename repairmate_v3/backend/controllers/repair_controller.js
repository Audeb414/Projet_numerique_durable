const db = require("../db");

// GET /api/repairs — liste avec filtres optionnels
exports.getAllRepairs = (req, res) => {
  const page      = parseInt(req.query.page) || 1;
  const limit     = 20;
  const offset    = (page - 1) * limit;
  const categorie = req.query.categorie || null;
  const statut    = req.query.statut    || null;
  const search    = req.query.search    || null;

  let where = [];
  let params = [];

  if (categorie) { where.push("categorie = ?"); params.push(categorie); }
  if (statut)    { where.push("statut = ?");    params.push(statut); }
  if (search)    { where.push("(titre LIKE ? OR description LIKE ?)"); params.push(`%${search}%`, `%${search}%`); }

  const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";

  const rows = db.all(
    `SELECT id, titre, categorie, statut, date_creation, demandeur_id, reparateur_id
     FROM repairs ${whereClause}
     ORDER BY date_creation DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const total = db.get(`SELECT COUNT(*) as count FROM repairs ${whereClause}`, params);

  res.json({ page, limit, total: total?.count || 0, data: rows });
};

exports.getRepairById = (req, res) => {
  const row = db.get(
    `SELECT r.id, r.titre, r.description, r.categorie, r.statut, r.date_creation,
      r.demandeur_id, r.reparateur_id,
      u.pseudo AS demandeur_pseudo,
      u2.pseudo AS reparateur_pseudo
     FROM repairs r
     JOIN users u ON r.demandeur_id = u.id
     LEFT JOIN users u2 ON r.reparateur_id = u2.id
     WHERE r.id = ?`,
    [req.params.id]
  );
  if (!row) return res.status(404).json({ error: "Demande non trouvee" });
  res.json(row);
};

exports.createRepair = (req, res) => {
  const { titre, description, categorie } = req.body;
  if (!titre || !description || !categorie)
    return res.status(400).json({ error: "Titre, description et categorie obligatoires" });

  const result = db.run(
    "INSERT INTO repairs (titre, description, categorie, statut, demandeur_id) VALUES (?, ?, ?, 'ouverte', ?)",
    [titre, description, categorie, req.session.user.id]
  );
  res.status(201).json({ message: "Demande creee", repairId: result.lastID });
};

exports.updateRepair = (req, res) => {
  const { id } = req.params;
  const { titre, description, categorie, statut } = req.body;
  const repair = db.get("SELECT * FROM repairs WHERE id = ?", [id]);
  if (!repair) return res.status(404).json({ error: "Demande non trouvee" });
  if (repair.demandeur_id !== req.session.user.id && req.session.user.role !== "admin")
    return res.status(403).json({ error: "Action non autorisee" });

  db.run(
    "UPDATE repairs SET titre = ?, description = ?, categorie = ?, statut = ? WHERE id = ?",
    [titre, description, categorie, statut, id]
  );
  res.json({ message: "Demande mise a jour" });
};

exports.deleteRepair = (req, res) => {
  const { id } = req.params;
  const repair = db.get("SELECT * FROM repairs WHERE id = ?", [id]);
  if (!repair) return res.status(404).json({ error: "Demande non trouvee" });
  if (repair.demandeur_id !== req.session.user.id && req.session.user.role !== "admin")
    return res.status(403).json({ error: "Action non autorisee" });

  db.run("DELETE FROM messages WHERE repair_id = ?", [id]);
  db.run("DELETE FROM notations WHERE repair_id = ?", [id]);
  db.run("DELETE FROM repairs WHERE id = ?", [id]);
  res.json({ message: "Demande supprimee" });
};

exports.takeRepair = (req, res) => {
  const { id } = req.params;
  const repair = db.get("SELECT * FROM repairs WHERE id = ?", [id]);
  if (!repair) return res.status(404).json({ error: "Demande non trouvee" });
  if (repair.reparateur_id !== null || repair.statut !== "ouverte")
    return res.status(400).json({ error: "Demande deja prise en charge ou indisponible" });
  if (repair.demandeur_id === req.session.user.id)
    return res.status(400).json({ error: "Vous ne pouvez pas prendre votre propre demande" });

  db.run(
    "UPDATE repairs SET reparateur_id = ?, statut = 'en_cours' WHERE id = ?",
    [req.session.user.id, id]
  );
  res.json({ message: "Demande prise en charge" });
};

// POST /api/repairs/:id/resoudre — marquer comme résolue (demandeur uniquement)
exports.resoudreRepair = (req, res) => {
  const { id } = req.params;
  const repair = db.get("SELECT * FROM repairs WHERE id = ?", [id]);
  if (!repair) return res.status(404).json({ error: "Demande non trouvee" });
  if (repair.statut !== "en_cours")
    return res.status(400).json({ error: "La demande doit etre en cours pour etre resolue" });
  if (repair.demandeur_id !== req.session.user.id && req.session.user.role !== "admin")
    return res.status(403).json({ error: "Seul le demandeur peut marquer comme resolue" });

  db.run("UPDATE repairs SET statut = 'resolue' WHERE id = ?", [id]);
  res.json({ message: "Demande marquee comme resolue" });
};
