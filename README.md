# 🔧 RepairMate

> La plateforme d'entraide entre étudiants pour réparer plutôt que jeter.

RepairMate met en relation des étudiants qui ont des objets cassés avec d'autres étudiants qui ont les compétences pour les réparer. Chaque réparation évite un achat et réduit l'impact environnemental du numérique et de la consommation.

---

## 🌐 Site déployé

**URL publique :** `[À compléter après déploiement]`

---

## 👥 Équipe

| Membre | Rôle principal |
|--------|---------------|
| [Prénom NOM] | Back-end (Auth, CRUD utilisateurs) |
| [Prénom NOM] | Back-end (CRUD réparations, messagerie) |
| [Prénom NOM] | Front-end (HTML/CSS, interface) |
| [Prénom NOM] | Base de données, déploiement, documentation |

---

## 🛠️ Stack technique

| Couche | Technologie | Justification Green IT |
|--------|------------|----------------------|
| Front-end | HTML5 + CSS3 natif | Aucun framework JS — zéro bundle envoyé au client |
| Templates | Rendu côté serveur (Express static) | Une seule requête HTTP par page |
| Back-end | Node.js + Express | Framework minimaliste (~200 Ko), bien maîtrisé |
| Base de données | SQLite (via sql.js) | Zéro serveur supplémentaire, aucune dépendance réseau |
| Authentification | Sessions + bcryptjs | Pas d'OAuth externe, pas de dépendance tierce |
| CSS | CSS natif, variables CSS | Pas de Tailwind CDN (60 Ko+), pas de Bootstrap (140 Ko+) |
| Déploiement | Render.com | Gratuit, simple, déploiement depuis GitHub |
| Versionnement | Git + GitHub | Obligatoire selon le cahier des charges |

---

## 🚀 Lancer le projet en local

### Prérequis
- Node.js ≥ 18
- npm ≥ 9

### Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/[username]/repairmate.git
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

Au premier lancement, un compte administrateur est créé automatiquement :
```
Email    : admin@repairmate.fr
Mot de passe : admin1234
```
> ⚠️ Changez ce mot de passe en production !

---

## 📁 Structure du dépôt

```
repairmate/
│
├── .github/
│   └── workflows/
│       └── ci.yml              ← Pipeline CI (lint + vérification sécurité)
│
├── backend/
│   ├── controllers/
│   │   ├── admin_controller.js      ← Gestion admin (stats, users, repairs)
│   │   ├── auth_controllers.js      ← Inscription, connexion, session
│   │   ├── dashboard_controller.js  ← Tableau de bord personnel + stats globales
│   │   ├── message_controller.js    ← Messagerie privée
│   │   ├── notation_controller.js   ← Système de notation 1-5 étoiles
│   │   ├── repair_controller.js     ← CRUD demandes de réparation
│   │   └── users_controllers.js     ← CRUD utilisateurs
│   ├── middleware/
│   │   └── auth_middleware.js       ← requireAuth, requireAdmin
│   ├── routes/
│   │   ├── admin_routes.js          ← /api/admin/*
│   │   ├── auth_routes.js           ← /api/auth/*
│   │   ├── dashboard_routes.js      ← /api/dashboard/*
│   │   ├── repair_routes.js         ← /api/repairs/*
│   │   └── user_routes.js           ← /api/users/*
│   ├── db.js                        ← Initialisation SQLite + méthodes get/all/run
│   ├── server.js                    ← Point d'entrée Express
│   ├── package.json
│   └── package-lock.json
│
├── database/
│   ├── init.js                      ← Script d'initialisation avec données de test
│   └── schema.sql                   ← Schéma SQL documenté (référence)
│
├── docs/
│   ├── diagrams/
│   │   ├── use_case.puml            ← Diagramme de cas d'utilisation (PlantUML)
│   │   ├── class_diagram.puml       ← Diagramme de classes (PlantUML)
│   │   └── sequence.puml            ← Diagramme de séquence (PlantUML)
│   ├── screenshots/
│   │   ├── README.md                ← Instructions captures d'écran
│   │   ├── lighthouse_*.png         ← Scores Lighthouse (à ajouter)
│   │   ├── ecoindex_*.png           ← Notes EcoIndex avant/après (à ajouter)
│   │   └── carbon_*.png             ← Website Carbon Calculator (à ajouter)
│   ├── wireframes/
│   │   └── *.png                    ← Maquettes des pages principales (à ajouter)
│   └── RepairMate_Rapport.pdf       ← Rapport final (à ajouter)
│
├── frontend/
│   └── public/
│       ├── css/
│       │   └── style.css            ← CSS natif, variables CSS, ~8 Ko
│       ├── js/
│       │   └── app.js               ← JS vanilla, SPA légère, ~30 Ko
│       └── index.html               ← Page unique (SPA)
│
├── .env.example                     ← Variables d'environnement (modèle)
├── .gitignore                       ← node_modules, .env, *.db exclus
└── README.md                        ← Ce fichier
```

---

## 🌿 Principes Green IT appliqués

- **Zéro framework JS côté client** : pas de React, Vue ou Angular — HTML/CSS/JS natif uniquement
- **Rendu serveur (SSR)** : une requête HTTP = une page complète, pas de bundle client
- **CSS artisanal** : ~8 Ko, pas de CDN Bootstrap ou Tailwind
- **Pas de polices Google Fonts** : utilisation des polices système (Arial)
- **Pas d'images inutiles** : interface 100% texte pour le MVP
- **SQLite embarqué** : pas de serveur de base de données séparé
- **Dépendances minimales** : 5 packages de production seulement
- **Pagination** : toutes les listes limitées à 20 résultats par page
- **Requêtes SQL ciblées** : jamais de `SELECT *`, colonnes explicitement listées

---

## 🔒 Sécurité

- Mots de passe hashés avec **bcryptjs** (10 rounds)
- Sessions sécurisées avec **express-session** (httpOnly cookie)
- Requêtes paramétrées (protection injections SQL)
- Routes protégées par middleware `requireAuth` / `requireAdmin`
- Variables sensibles dans `.env` (exclu du dépôt via `.gitignore`)

---

## 📊 Indicateurs Green IT cibles

| Indicateur | Objectif | Statut |
|------------|---------|--------|
| Poids page d'accueil | < 200 Ko | À mesurer |
| Requêtes HTTP / page | < 5 | ✅ (3 : HTML + CSS + JS) |
| Score Lighthouse Perf. | > 80/100 | À mesurer |
| Note EcoIndex | A ou B | À mesurer |
| CO₂ / visite | < 0,1 g | À mesurer |
| Dépendances npm (prod) | < 10 | ✅ (5) |

---

## 📋 Conventions de commits

```
feat: ajout d'une nouvelle fonctionnalité
fix: correction d'un bug
docs: modification de la documentation
style: mise en forme (pas de logique modifiée)
refactor: refactoring sans changement de comportement
test: ajout ou modification de tests
chore: maintenance, dépendances
```

Exemples :
```
feat: ajout système de notation 1-5 étoiles
fix: correction bug lastID dans db.run()
docs: mise à jour README avec instructions déploiement
```

---

## 📝 Rapport

Le rapport PDF est disponible dans [`/docs/RepairMate_Rapport.pdf`](./docs/RepairMate_Rapport.pdf)

---

## 📄 Licence

Projet académique — EFREI Paris — TI616 Numérique Durable — 2025-2026
