const db = require("../db");

// GET /api/repairs/:id/messages — lire les messages d'une demande
exports.getMessages = (req, res) => {
  const { id } = req.params;

  // Seuls le demandeur et le réparateur peuvent lire les messages
  const repair = db.get("SELECT * FROM repairs WHERE id = ?", [id]);
  if (!repair) return res.status(404).json({ error: "Demande non trouvee" });

  const userId = req.session.user.id;
  const isAdmin = req.session.user.role === "admin";
  if (!isAdmin && userId !== repair.demandeur_id && userId !== repair.reparateur_id)
    return res.status(403).json({ error: "Acces refuse" });

  // Marquer comme lus les messages que l'utilisateur reçoit
  db.run(
    "UPDATE messages SET lu = 1 WHERE repair_id = ? AND auteur_id != ?",
    [id, userId]
  );

  const messages = db.all(
    `SELECT m.id, m.contenu, m.date_envoi, m.lu, m.auteur_id,
            u.pseudo AS auteur_pseudo
     FROM messages m
     JOIN users u ON m.auteur_id = u.id
     WHERE m.repair_id = ?
     ORDER BY m.date_envoi ASC`,
    [id]
  );

  res.json({ data: messages });
};

// POST /api/repairs/:id/messages — envoyer un message
exports.sendMessage = (req, res) => {
  const { id } = req.params;
  const { contenu } = req.body;

  if (!contenu || !contenu.trim())
    return res.status(400).json({ error: "Le message ne peut pas etre vide" });

  const repair = db.get("SELECT * FROM repairs WHERE id = ?", [id]);
  if (!repair) return res.status(404).json({ error: "Demande non trouvee" });

  const userId = req.session.user.id;
  const isAdmin = req.session.user.role === "admin";
  if (!isAdmin && userId !== repair.demandeur_id && userId !== repair.reparateur_id)
    return res.status(403).json({ error: "Seuls le demandeur et le reparateur peuvent echanger ici" });

  const result = db.run(
    "INSERT INTO messages (repair_id, auteur_id, contenu) VALUES (?, ?, ?)",
    [id, userId, contenu.trim()]
  );

  res.status(201).json({ message: "Message envoye", messageId: result.lastID });
};

// GET /api/messages/unread — nombre de messages non lus pour l'utilisateur connecté
exports.getUnreadCount = (req, res) => {
  const userId = req.session.user.id;

  // Messages non lus dans les demandes où l'utilisateur est impliqué
  const result = db.get(
    `SELECT COUNT(*) as count FROM messages m
     JOIN repairs r ON m.repair_id = r.id
     WHERE m.lu = 0
       AND m.auteur_id != ?
       AND (r.demandeur_id = ? OR r.reparateur_id = ?)`,
    [userId, userId, userId]
  );

  res.json({ unread: result?.count || 0 });
};
