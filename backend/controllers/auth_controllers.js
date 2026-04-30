const db = require("../db");
const bcrypt = require("bcryptjs");

exports.register = async (req, res) => {
  try {
    const { pseudo, email, password, competences, ville } = req.body;
    if (!pseudo || !email || !password)
      return res.status(400).json({ error: "Pseudo, email et mot de passe obligatoires" });

    const existing = db.get("SELECT id FROM users WHERE email = ?", [email]);
    if (existing)
      return res.status(409).json({ error: "Email deja utilise" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db.run(
      "INSERT INTO users (pseudo, email, password_hash, competences, ville, role) VALUES (?, ?, ?, ?, ?, 'etudiant')",
      [pseudo, email, hashedPassword, competences || null, ville || null]
    );
    res.status(201).json({ message: "Utilisateur cree", userId: result.lastID });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email et mot de passe obligatoires" });

    const user = db.get(
      "SELECT id, pseudo, email, password_hash, role FROM users WHERE email = ?",
      [email]
    );
    if (!user)
      return res.status(401).json({ error: "Utilisateur introuvable" });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid)
      return res.status(401).json({ error: "Mot de passe incorrect" });

    req.session.user = { id: user.id, pseudo: user.pseudo, email: user.email, role: user.role };
    res.json({ message: "Connexion reussie", user: req.session.user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.me = (req, res) => {
  if (!req.session.user)
    return res.status(401).json({ error: "Non connecte" });
  res.json(req.session.user);
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.json({ message: "Deconnexion reussie" }));
};
