const db = require("../db");

// GET /api/admin/stats — tableau de bord admin complet
exports.getAdminStats = (req, res) => {
  const totalUsers    = db.get("SELECT COUNT(*) as c FROM users WHERE role='etudiant'");
  const totalAdmins   = db.get("SELECT COUNT(*) as c FROM users WHERE role='admin'");
  const totalRepairs  = db.get("SELECT COUNT(*) as c FROM repairs");
  const ouvertes      = db.get("SELECT COUNT(*) as c FROM repairs WHERE statut='ouverte'");
  const en_cours      = db.get("SELECT COUNT(*) as c FROM repairs WHERE statut='en_cours'");
  const resolues      = db.get("SELECT COUNT(*) as c FROM repairs WHERE statut='resolue'");
  const totalMessages = db.get("SELECT COUNT(*) as c FROM messages");
  const totalNotations= db.get("SELECT COUNT(*) as c FROM notations");
  const moyenneNotes  = db.get("SELECT ROUND(AVG(note),1) as m FROM notations");

  // Inscriptions des 7 derniers jours
  const newUsers7d = db.get(
    "SELECT COUNT(*) as c FROM users WHERE date_inscription >= datetime('now','-7 days')"
  );
  const newRepairs7d = db.get(
    "SELECT COUNT(*) as c FROM repairs WHERE date_creation >= datetime('now','-7 days')"
  );

  res.json({
    users: {
      total:   totalUsers?.c   || 0,
      admins:  totalAdmins?.c  || 0,
      new7d:   newUsers7d?.c   || 0,
    },
    repairs: {
      total:    totalRepairs?.c || 0,
      ouvertes: ouvertes?.c     || 0,
      en_cours: en_cours?.c     || 0,
      resolues: resolues?.c     || 0,
      new7d:    newRepairs7d?.c || 0,
    },
    messages:  totalMessages?.c  || 0,
    notations: totalNotations?.c || 0,
    moyenneNotes: moyenneNotes?.m || null,
  });
};

// GET /api/admin/users — liste complète avec recherche
exports.getUsers = (req, res) => {
  const search = req.query.search || "";
  const role   = req.query.role   || "";
  const page   = parseInt(req.query.page) || 1;
  const limit  = 20;
  const offset = (page - 1) * limit;

  let where = []; let params = [];
  if (search) { where.push("(pseudo LIKE ? OR email LIKE ? OR ville LIKE ?)"); params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
  if (role)   { where.push("role = ?"); params.push(role); }
  const wc = where.length ? "WHERE " + where.join(" AND ") : "";

  const rows = db.all(
    `SELECT id, pseudo, email, ville, competences, role, date_inscription
     FROM users ${wc} ORDER BY date_inscription DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const total = db.get(`SELECT COUNT(*) as c FROM users ${wc}`, params);

  // Pour chaque user, ajouter ses stats rapides
  const enriched = rows.map(u => {
    const stats = db.get(
      "SELECT COUNT(*) as nb FROM repairs WHERE demandeur_id = ? OR reparateur_id = ?",
      [u.id, u.id]
    );
    const note = db.get(
      "SELECT ROUND(AVG(note),1) as m, COUNT(*) as nb FROM notations WHERE note_destinataire_id = ?",
      [u.id]
    );
    return { ...u, nbRepairs: stats?.nb || 0, noteMoyenne: note?.m || null, nbAvis: note?.nb || 0 };
  });

  res.json({ page, limit, total: total?.c || 0, data: enriched });
};

// PUT /api/admin/users/:id/role — changer le rôle d'un utilisateur
exports.changeRole = (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["etudiant","admin"].includes(role))
    return res.status(400).json({ error: "Rôle invalide. Valeurs acceptées : etudiant, admin" });

  // Empêcher de se rétrograder soi-même
  if (Number(id) === req.session.user.id)
    return res.status(400).json({ error: "Vous ne pouvez pas modifier votre propre rôle" });

  const user = db.get("SELECT id, pseudo FROM users WHERE id = ?", [id]);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

  db.run("UPDATE users SET role = ? WHERE id = ?", [role, id]);
  res.json({ message: `Rôle de ${user.pseudo} changé en "${role}"` });
};

// DELETE /api/admin/users/:id — supprimer un utilisateur (avec cascade)
exports.deleteUser = (req, res) => {
  const { id } = req.params;
  if (Number(id) === req.session.user.id)
    return res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte ici" });

  const user = db.get("SELECT id FROM users WHERE id = ?", [id]);
  if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

  // Cascade manuelle
  const repairs = db.all("SELECT id FROM repairs WHERE demandeur_id = ?", [id]);
  repairs.forEach(r => {
    db.run("DELETE FROM messages  WHERE repair_id = ?", [r.id]);
    db.run("DELETE FROM notations WHERE repair_id = ?", [r.id]);
  });
  db.run("DELETE FROM repairs  WHERE demandeur_id = ?", [id]);
  db.run("DELETE FROM messages WHERE auteur_id    = ?", [id]);
  db.run("DELETE FROM users    WHERE id           = ?", [id]);

  res.json({ message: "Utilisateur et toutes ses données supprimés" });
};

// GET /api/admin/repairs — toutes les demandes avec infos enrichies
exports.getRepairs = (req, res) => {
  const search   = req.query.search   || "";
  const statut   = req.query.statut   || "";
  const categorie= req.query.categorie|| "";
  const page     = parseInt(req.query.page) || 1;
  const limit    = 20;
  const offset   = (page - 1) * limit;

  let where = []; let params = [];
  if (search)    { where.push("(r.titre LIKE ? OR r.description LIKE ?)"); params.push(`%${search}%`,`%${search}%`); }
  if (statut)    { where.push("r.statut = ?");    params.push(statut); }
  if (categorie) { where.push("r.categorie = ?"); params.push(categorie); }
  const wc = where.length ? "WHERE " + where.join(" AND ") : "";

  const rows = db.all(
    `SELECT r.id, r.titre, r.categorie, r.statut, r.date_creation,
            u1.pseudo AS demandeur_pseudo, u2.pseudo AS reparateur_pseudo,
            (SELECT COUNT(*) FROM messages m WHERE m.repair_id = r.id) AS nb_messages
     FROM repairs r
     JOIN users u1 ON r.demandeur_id = u1.id
     LEFT JOIN users u2 ON r.reparateur_id = u2.id
     ${wc}
     ORDER BY r.date_creation DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const total = db.get(`SELECT COUNT(*) as c FROM repairs r ${wc}`, params);

  res.json({ page, limit, total: total?.c || 0, data: rows });
};

// PUT /api/admin/repairs/:id/statut — forcer le statut d'une demande
exports.changeStatut = (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;

  if (!["ouverte","en_cours","resolue"].includes(statut))
    return res.status(400).json({ error: "Statut invalide" });

  const repair = db.get("SELECT id FROM repairs WHERE id = ?", [id]);
  if (!repair) return res.status(404).json({ error: "Demande non trouvée" });

  db.run("UPDATE repairs SET statut = ? WHERE id = ?", [statut, id]);
  res.json({ message: `Statut changé en "${statut}"` });
};

// DELETE /api/admin/repairs/:id — supprimer une demande (avec cascade)
exports.deleteRepair = (req, res) => {
  const { id } = req.params;
  const repair = db.get("SELECT id FROM repairs WHERE id = ?", [id]);
  if (!repair) return res.status(404).json({ error: "Demande non trouvée" });

  db.run("DELETE FROM messages  WHERE repair_id = ?", [id]);
  db.run("DELETE FROM notations WHERE repair_id = ?", [id]);
  db.run("DELETE FROM repairs   WHERE id        = ?", [id]);
  res.json({ message: "Demande supprimée" });
};
