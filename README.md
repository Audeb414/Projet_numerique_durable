# 🔧 RepairMate

> La plateforme d'entraide entre étudiants pour réparer plutôt que jeter.

RepairMate met en relation des étudiants qui ont des objets cassés avec d'autres étudiants qui ont les compétences pour les réparer. Chaque réparation évite un achat et réduit l'impact environnemental du numérique et de la consommation.

---

## 🌐 Site déployé

**URL publique :** [https://projet-numerique-durable-repairmate.onrender.com](https://projet-numerique-durable-repairmate.onrender.com)

---

## 👥 Équipe

| Membre | Branche | Rôle principal |
|--------|---------|----------------|
| [Blondelle KAWA] | `dev-back` | Back-end — serveur Express, base de données, middleware |
| [Rivelia KPADONOU] | `feature/auth` | Back-end — authentification (register, login, logout) |
| [Johanna LAUWA] | `feature/repair-crud` | Back-end — CRUD réparations, messagerie, notation, admin |
| [Leslie KAMGUEM] | `dev-front` | Front-end — HTML/CSS, interface utilisateur, JavaScript |
| [Aude NGUEPA] | `database` + `docs` | Base de données, déploiement, CI/CD, documentation |

---

## 🛠️ Stack technique

| Couche | Technologie | Justification Green IT |
|--------|------------|----------------------|
| Front-end | HTML5 + CSS3 natif | Aucun framework JS — zéro bundle envoyé au client |
| Templates | Rendu côté serveur (Express static) | Une seule requête HTTP par page chargée |
| Back-end | Node.js + Express 4 | Framework minimaliste (~200 Ko), bien maîtrisé par l'équipe |
| Base de données | SQLite via sql.js | Zéro serveur supplémentaire, aucune dépendance réseau |
| Authentification | Sessions + bcryptjs | Pas d'OAuth externe, pas de dépendance tierce |
| CSS | CSS natif, variables CSS | Pas de Tailwind CDN (60 Ko+), pas de Bootstrap (140 Ko+) |
| Déploiement | Render.com | Gratuit, déploiement automatique depuis GitHub |
| Versionnement | Git + GitHub | Obligatoire selon le cahier des charges |

---

## 🚀 Lancer le projet en local

### Prérequis
- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/Audeb414/Projet_numerique_durable.git
cd repairmate

# 2. Installer les dépendances
cd backend
npm install

# 3. Configurer les variables d'environnement
cp ../.env.example ../.env
# Éditer .env si nécessaire (PORT, SESSION_SECRET)

# 4. Lancer le serveur
node server.js
```

Le serveur démarre sur **http://localhost:3000**

> Au premier lancement, un compte administrateur est créé automatiquement :
> ```
> Email    : admin@repairmate.fr
> Password : admin1234
> ```
> ⚠️ Changez ce mot de passe en production !

---

## 📁 Structure du dépôt

```
repairmate/
│
├── .github/
│   └── workflows/
│       └── ci.yml                   ← Pipeline CI (lint + vérification sécurité)
│
├── backend/
│   ├── controllers/
│   │   ├── admin_controller.js      ← Panel admin (stats globales, users, repairs)
│   │   ├── auth_controllers.js      ← Inscription, connexion, session
│   │   ├── dashboard_controller.js  ← Tableau de bord personnel + stats
│   │   ├── message_controller.js    ← Messagerie privée par demande
│   │   ├── notation_controller.js   ← Système de notation 1-5 étoiles
│   │   ├── repair_controller.js     ← CRUD demandes de réparation + filtres
│   │   └── users_controllers.js     ← CRUD utilisateurs
│   ├── middleware/
│   │   └── auth_middleware.js       ← requireAuth, requireAdmin
│   ├── routes/
│   │   ├── admin_routes.js          ← /api/admin/*
│   │   ├── auth_routes.js           ← /api/auth/*
│   │   ├── dashboard_routes.js      ← /api/dashboard/*
│   │   ├── repair_routes.js         ← /api/repairs/*
│   │   └── user_routes.js           ← /api/users/*
│   ├── db.js                        ← Initialisation SQLite (sql.js) + méthodes get/all/run
│   ├── server.js                    ← Point d'entrée Express
│   ├── package.json                 ← 5 dépendances de production
│   └── package-lock.json
│
├── database/
│   ├── init.js                      ← Script d'initialisation avec données de test
│   └── schema.sql                   ← Schéma SQL documenté avec index
│
├── docs/
│   ├── diagrams/
│   │   ├── use_case.puml            ← Diagramme de cas d'utilisation (PlantUML)
│   │   ├── class_diagram.puml       ← Diagramme de classes (PlantUML)
│   │   └── sequence.puml            ← Diagramme de séquence (PlantUML)
│   ├── screenshots/
│   │   ├── lighthouse_accueil.png   ← Score Lighthouse page d'accueil
│   │   ├── ecoindex.png             ← Note EcoIndex (A — 89/100)
│   │   └── carbon.png               ← Website Carbon Calculator (A+)
│   ├── wireframes/
│   │   └── *.png                    ← Captures d'écran des pages principales
│   └── RepairMate_Rapport.pdf       ← Rapport final Partie 1 + Partie 2
│
├── frontend/
│   └── public/
│       ├── css/
│       │   └── style.css            ← CSS natif avec variables CSS (~8 Ko)
│       ├── js/
│       │   └── app.js               ← JS vanilla, SPA légère (~30 Ko)
│       └── index.html               ← Page unique (SPA — rendu serveur)
│
├── .env.example                     ← Variables d'environnement (modèle)
├── .gitignore                       ← node_modules/, .env, *.db exclus
└── README.md                        ← Ce fichier
```

---

## ✨ Fonctionnalités implémentées

- **Authentification complète** — inscription, connexion, déconnexion, sessions sécurisées
- **CRUD Utilisateurs** — création, lecture paginée, modification, suppression avec confirmation
- **CRUD Demandes de réparation** — publication, filtres par catégorie/statut/mot-clé, prise en charge, résolution
- **Messagerie privée** — échange asynchrone entre demandeur et réparateur par demande
- **Système de notation** — 1 à 5 étoiles avec commentaire, moyenne par réparateur
- **Tableau de bord personnel** — stats, activité récente, alertes messages non lus
- **Panel administrateur** — stats globales, gestion utilisateurs et demandes, promotion de rôles

---

## 🌿 Principes Green IT appliqués

- **Zéro framework JS côté client** — pas de React, Vue ou Angular — HTML/CSS/JS natif uniquement
- **Rendu serveur (SSR)** — une requête HTTP = une page complète, pas de bundle client
- **CSS artisanal ~8 Ko** — pas de CDN Bootstrap ou Tailwind
- **Pas de polices Google Fonts** — utilisation des polices système (Arial)
- **Pas d'images inutiles** — interface 100% texte pour le MVP
- **SQLite embarqué** — pas de serveur de base de données séparé
- **5 dépendances de production seulement** — express, express-session, cors, bcryptjs, sql.js
- **Pagination systématique** — 20 résultats par page maximum
- **Requêtes SQL ciblées** — jamais de `SELECT *`, colonnes explicitement listées

---

## 📊 Indicateurs Green IT mesurés

| Indicateur | Objectif | Résultat | Statut |
|------------|---------|----------|--------|
| Poids page d'accueil | < 200 Ko | **14 Ko** | ✅ Exceptionnel |
| Requêtes HTTP / page | < 15 | **3** (HTML + CSS + JS) | ✅ Excellent |
| Score Lighthouse Perf. | > 80/100 | **100/100** | ✅ Parfait |
| FCP | < 1,8 s | **0,3 s** | ✅ Excellent |
| LCP | < 2,5 s | **0,4 s** | ✅ Excellent |
| Note EcoIndex | A ou B | **A (89/100)** | ✅ Maximum |
| CO₂ / visite | < 0,1 g | **< 0,01 g** | ✅ Exceptionnel |
| Dépendances npm (prod) | < 10 | **5** | ✅ Sobre |

---

## 🔒 Sécurité

- Mots de passe hashés avec **bcryptjs** (10 rounds)
- Sessions sécurisées avec **express-session** (cookie httpOnly)
- Requêtes paramétrées — protection contre les injections SQL
- Routes protégées par middleware `requireAuth` / `requireAdmin`
- Variables sensibles dans `.env` (exclu du dépôt via `.gitignore`)

---

## 📋 Conventions de commits

```
feat     — ajout d'une nouvelle fonctionnalité
fix      — correction d'un bug
docs     — modification de la documentation
style    — mise en forme (pas de logique modifiée)
refactor — refactoring sans changement de comportement
chore    — maintenance, dépendances
```

Exemples :
```
feat: ajout système de notation 1-5 étoiles
feat: messagerie privée par demande de réparation
fix: correction bug lastID dans db.run()
docs: mise à jour README avec URL déploiement
chore: ajout robots.txt et meta description SEO
```

---

## 📝 Rapport

Le rapport PDF (Parties 1 et 2) est disponible dans [`/docs/RepairMate_Rapport.pdf`](./docs/RepairMate_Rapport.pdf)

---

## 📄 Licence

Projet académique — EFREI Paris — TI616 Numérique Durable — 2025-2026

