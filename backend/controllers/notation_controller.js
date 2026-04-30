const db = require("../db");

// POST /api/repairs/:id/noter — noter un réparateur après résolution
exports.noterReparateur = (req, res) => {
  const { id } = req.params;
  const { note, commentaire } = req.body;

  if (!note || note < 1 || note > 5)
    return res.status(400).json({ error: "La note doit etre entre 1 et 5" });

  const repair = db.get("SELECT * FROM repairs WHERE id = ?", [id]);
  if (!repair) return res.status(404).json({ error: "Demande non trouvee" });
  if (repair.statut !== "resolue")
    return res.status(400).json({ error: "Seules les demandes resolues peuvent etre notees" });
  if (!repair.reparateur_id)
    return res.status(400).json({ error: "Aucun reparateur assigne" });

  const userId = req.session.user.id;
  if (userId !== repair.demandeur_id)
    return res.status(403).json({ error: "Seul le demandeur peut noter le reparateur" });

  const existing = db.get("SELECT id FROM notations WHERE repair_id = ?", [id]);
  if (existing)
    return res.status(409).json({ error: "Vous avez deja note cette reparation" });

  db.run(
    `INSERT INTO notations (repair_id, notateur_id, note_destinataire_id, note, commentaire)
     VALUES (?, ?, ?, ?, ?)`,
    [id, userId, repair.reparateur_id, note, commentaire?.trim() || null]
  );

  res.status(201).json({ message: "Notation enregistree" });
};

// GET /api/users/:id/notations — moyenne et avis reçus par un utilisateur
exports.getNotationsUser = (req, res) => {
  const { id } = req.params;

  const moyenne = db.get(
    `SELECT ROUND(AVG(note), 1) as moyenne, COUNT(*) as total
     FROM notations WHERE note_destinataire_id = ?`,
    [id]
  );

  const avis = db.all(
    `SELECT n.note, n.commentaire, n.date_notation, u.pseudo AS auteur_pseudo
     FROM notations n
     JOIN users u ON n.notateur_id = u.id
     WHERE n.note_destinataire_id = ?
     ORDER BY n.date_notation DESC`,
    [id]
  );

  res.json({
    moyenne: moyenne?.moyenne || null,
    total: moyenne?.total || 0,
    avis
  });
};

// GET /api/repairs/:id/notation — voir si une demande a été notée
exports.getNotationRepair = (req, res) => {
  const row = db.get(
    `SELECT n.note, n.commentaire, n.date_notation, u.pseudo AS auteur_pseudo
     FROM notations n
     JOIN users u ON n.notateur_id = u.id
     WHERE n.repair_id = ?`,
    [req.params.id]
  );
  res.json(row || null);
};
