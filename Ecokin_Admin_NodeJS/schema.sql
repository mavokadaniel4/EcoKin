-- Base de données EcoKin - Administration citoyenne de Kinshasa
CREATE DATABASE IF NOT EXISTS ecokin CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecokin;

-- Table des administrateurs
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    cree_le DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Compte admin par défaut (mot de passe : Kinshasa2026)
INSERT INTO admins (email, mot_de_passe) VALUES
('admin@ecokin.cd', '$2y$10$e0Nw7XcQ2b0mS8kK6oQwCOqk7cQm6mQm3m5r0Zp6i7c1g6q6cJ4Vy')
ON DUPLICATE KEY UPDATE email = email;

-- Citoyens
CREATE TABLE IF NOT EXISTS citoyens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    alertes INT DEFAULT 0,
    statut ENUM('Actif','Bloqué') DEFAULT 'Actif',
    cree_le DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Signalements de déchets
CREATE TABLE IF NOT EXISTS signalements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    citoyen VARCHAR(150) NOT NULL,
    commune VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    latitude DECIMAL(10,6) DEFAULT NULL,
    longitude DECIMAL(10,6) DEFAULT NULL,
    description TEXT,
    media VARCHAR(255) DEFAULT NULL,
    statut ENUM('en attente','traité','rejeté') DEFAULT 'en attente'
) ENGINE=InnoDB;

-- Articles de sensibilisation
CREATE TABLE IF NOT EXISTS articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    auteur VARCHAR(150) NOT NULL,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT,
    date DATE NOT NULL,
    statut ENUM('en attente','publié','rejeté') DEFAULT 'en attente'
) ENGINE=InnoDB;

-- Points de collecte / infrastructures urbaines
CREATE TABLE IF NOT EXISTS points_collecte (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(200) NOT NULL,
    commune VARCHAR(100) NOT NULL,
    coordonnees VARCHAR(100) DEFAULT NULL,
    type VARCHAR(50) DEFAULT 'Bacs Standards'
) ENGINE=InnoDB;

-- Données d'exemple
INSERT INTO signalements (citoyen, commune, date, statut) VALUES
('Kavira Deborah','Gombe','2026-07-02','en attente'),
('Jean Mwamba','Limete','2026-07-01','traité'),
('Sarah K.','Ndjili','2026-06-29','rejeté');

INSERT INTO articles (auteur, titre, date, statut) VALUES
('Kavira D.','Le traitement des plastiques à la Gombe','2026-07-02','en attente'),
('Arsène L.','Faire du compost chez soi à Kinshasa','2026-06-28','publié');

INSERT INTO citoyens (nom, email, alertes, statut) VALUES
('Kavira Tchakuno','kavira.tchak@ecokin.cd',14,'Actif'),
('Compte Suspect Spam','spam.kin@test.com',1,'Bloqué');

INSERT INTO points_collecte (nom, commune, type) VALUES
('Décharge Centrale Principale','Limete','Centre de Tri'),
('Point Vert de Recyclage Kintambo Magasin','Kintambo','Bac Plastiques'),
('Bacs Publics du Boulevard du 30 Juin','Gombe','Bacs Standards');
