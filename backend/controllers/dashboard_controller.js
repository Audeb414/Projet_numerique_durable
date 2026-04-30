const db = require("../db");

// GET /api/dashboard — stats personnelles de l'utilisateur connecté
exports.getDashboard = (req, res) => {
  const userId = req.session.user.id;

  const mesDemandesTotal = db.get(
    "SELECT COUNT(*) as count FROM repairs WHERE demandeur_id = ?", [userId]
  );
  const mesDemandesResolues = db.get(
    "SELECT COUNT(*) as count FROM repairs WHERE demandeur_id = ? AND statut = 'resolue'", [userId]
  );
  const reparationsEffectuees = db.get(
    "SELECT COUNT(*) as count FROM repairs WHERE reparateur_id = ? AND statut = 'resolue'", [userId]
  );
  const enCours = db.get(
    "SELECT COUNT(*) as count FROM repairs WHERE (demandeur_id = ? OR reparateur_id = ?) AND statut = 'en_cours'",
    [userId, userId]
  );
  const maNote = db.get(
    "SELECT ROUND(AVG(note), 1) as moyenne, COUNT(*) as total FROM notations WHERE note_destinataire_id = ?",
    [userId]
  );
  const messagesNonLus = db.get(
    `SELECT COUNT(*) as count FROM messages m
     JOIN repairs r ON m.repair_id = r.id
     WHERE m.lu = 0 AND m.auteur_id != ?
       AND (r.demandeur_id = ? OR r.reparateur_id = ?)`,
    [userId, userId, userId]
  );

  // Activité récente : mes 5 dernières demandes ou reparations
  const activiteRecente = db.all(
    `SELECT r.id, r.titre, r.statut, r.categorie, r.date_creation,
            CASE WHEN r.demandeur_id = ? THEN 'demandeur' ELSE 'reparateur' END AS mon_role
     FROM repairs r
     WHERE r.demandeur_id = ? OR r.reparateur_id = ?
     ORDER BY r.date_creation DESC LIMIT 5`,
    [userId, userId, userId]
  );

  res.json({
    mesDemandesTotal: mesDemandesTotal?.count || 0,
    mesDemandesResolues: mesDemandesResolues?.count || 0,
    reparationsEffectuees: reparationsEffectuees?.count || 0,
    enCours: enCours?.count || 0,
    maNote: maNote?.moyenne || null,
    totalNotations: maNote?.total || 0,
    messagesNonLus: messagesNonLus?.count || 0,
    activiteRecente
  });
};

// GET /api/stats — statistiques globales de la plateforme (public)
exports.getStats = (req, res) => {
  const totalRepairs   = db.get("SELECT COUNT(*) as count FROM repairs");
  const resolues       = db.get("SELECT COUNT(*) as count FROM repairs WHERE statut = 'resolue'");
  const totalUsers     = db.get("SELECT COUNT(*) as count FROM users WHERE role = 'etudiant'");
  const totalMessages  = db.get("SELECT COUNT(*) as count FROM messages");

  res.json({
    totalRepairs:  totalRepairs?.count  || 0,
    resolues:      resolues?.count      || 0,
    totalUsers:    totalUsers?.count    || 0,
    totalMessages: totalMessages?.count || 0,
  });
};
