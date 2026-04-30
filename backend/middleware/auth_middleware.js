exports.requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Accès refusé" });
  }
  next();
};
 
exports.requireAdmin = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Accès refusé" });
  }
 
  if (req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Réservé à l'administrateur" });
  }
 
  next();
};