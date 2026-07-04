# EcoKin Admin — Node.js + MySQL

Backend Node.js (Express + EJS) remplaçant l'ancienne version PHP. Les vues HTML/CSS/Bootstrap sont conservées à l'identique.

## Installation

1. Créer la base : importer `schema.sql` dans MySQL.
2. Installer les dépendances :
   ```
   npm install
   ```
3. Configurer (optionnel) les variables d'environnement : `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `SESSION_SECRET`, `PORT`.
4. Lancer le serveur :
   ```
   npm start
   ```
5. Ouvrir http://localhost:3000/login  
   Compte de secours : `admin@ecokin.cd` / `Kinshasa2026`

## Structure

- `server.js` — Serveur Express, routes et logique MySQL
- `db.js` — Pool de connexion MySQL (`mysql2/promise`)
- `views/` — Templates EJS (mêmes HTML/CSS/Bootstrap que la version PHP)
- `schema.sql` — Base de données EcoKin
