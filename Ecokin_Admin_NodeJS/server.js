// Serveur Node.js / Express pour EcoKin Admin
const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET || 'ecokin-secret-key',
    resave: false,
    saveUninitialized: false,
}));

// Sécurité : accès réservé aux admins connectés
function requireAdmin(req, res, next) {
    if (!req.session.admin_email) return res.redirect('/login');
    next();
}

// Charge signalements + articles (utilisés dans header) et traite les actions
async function loadCommon(req) {
    const { action, id, type } = req.query;
    let flash = null;
    const tables = { signalement: 'signalements', article: 'articles' };
    const statuts = ['en attente', 'traité', 'rejeté', 'publié'];
    if (action && id && type && tables[type] && statuts.includes(action)) {
        const table = tables[type];
        await pool.query(`UPDATE ${table} SET statut = ? WHERE id = ?`, [action, parseInt(id, 10)]);
        flash = `L'élément (${type} #${parseInt(id, 10)}) a été passé au statut : <strong>${action}</strong>.`;
    }
    const [signalements] = await pool.query(
        "SELECT id, citoyen, commune, date, statut FROM signalements ORDER BY date DESC"
    );
    const [articles] = await pool.query(
        "SELECT id, auteur, titre, date, statut FROM articles ORDER BY date DESC"
    );
    return { signalements, articles, flash, admin_email: req.session.admin_email };
}

// ---------- LOGIN ----------
app.get('/login', (req, res) => res.render('login', { erreur: '' }));

app.post('/login', async (req, res) => {
    const email = (req.body.email || '').trim();
    const password = req.body.password || '';
    const [rows] = await pool.query(
        "SELECT id, mot_de_passe FROM admins WHERE email = ? LIMIT 1", [email]
    );
    let ok = false;
    let admin = rows[0];
    if (admin) {
        try { ok = await bcrypt.compare(password, admin.mot_de_passe); } catch (e) { ok = false; }
        if (!ok && password === 'Kinshasa2026' && email === 'admin@ecokin.cd') {
            ok = true; // accès de secours identique à la version initiale
        }
    }
    if (ok) {
        req.session.admin_id = admin ? admin.id : 0;
        req.session.admin_email = email;
        return res.redirect('/dashboard');
    }
    res.render('login', { erreur: 'Adresse email ou mot de passe incorrect.' });
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

app.get('/', (req, res) => res.redirect('/dashboard'));

// ---------- DASHBOARD ----------
app.get('/dashboard', requireAdmin, async (req, res) => {
    const common = await loadCommon(req);
    const [[a]] = await pool.query("SELECT COUNT(*) AS n FROM signalements WHERE statut='en attente'");
    const [[b]] = await pool.query("SELECT COUNT(*) AS n FROM signalements WHERE statut='traité'");
    const [[c]] = await pool.query("SELECT COUNT(*) AS n FROM citoyens");
    const [[d]] = await pool.query("SELECT COUNT(*) AS n FROM articles WHERE statut='publié'");
    const [alertes] = await pool.query(
        "SELECT commune, citoyen, statut FROM signalements ORDER BY date DESC LIMIT 3"
    );
    const [rows] = await pool.query(
        "SELECT commune, COUNT(*) AS n FROM signalements GROUP BY commune ORDER BY n DESC LIMIT 3"
    );
    const total = rows.reduce((s, r) => s + Number(r.n), 0);
    const activite = rows.map(r => ({ commune: r.commune, pct: total ? Math.round(r.n * 100 / total) : 0 }));
    res.render('dashboard', {
        ...common,
        stat_signalements: a.n, stat_traites: b.n, stat_citoyens: c.n, stat_articles: d.n,
        dernieres_alertes: alertes, activite,
    });
});

// ---------- SIGNALEMENTS ----------
app.get('/gestion-signalements', requireAdmin, async (req, res) => {
    const common = await loadCommon(req);
    res.render('gestion-signalements', common);
});

// ---------- ARTICLES ----------
app.get('/moderation-articles', requireAdmin, async (req, res) => {
    const common = await loadCommon(req);
    res.render('moderation-articles', common);
});

// ---------- UTILISATEURS ----------
app.get('/gestion-utilisateurs', requireAdmin, async (req, res) => {
    if (req.query.bloquer) {
        await pool.query(
            "UPDATE citoyens SET statut = IF(statut='Actif','Bloqué','Actif') WHERE id = ?",
            [parseInt(req.query.bloquer, 10)]
        );
    }
    const common = await loadCommon(req);
    const [citoyens] = await pool.query(
        "SELECT id, nom, email, alertes, statut FROM citoyens ORDER BY id ASC"
    );
    res.render('gestion-utilisateurs', { ...common, citoyens });
});

// ---------- POINTS DE COLLECTE ----------
app.get('/configuration-communes', requireAdmin, async (req, res) => {
    const common = await loadCommon(req);
    const [points] = await pool.query(
        "SELECT id, nom, commune, type FROM points_collecte ORDER BY id ASC"
    );
    res.render('configuration-communes', { ...common, points, msg: '' });
});

app.post('/configuration-communes', requireAdmin, async (req, res) => {
    const nom = (req.body.nom || '').trim();
    const commune = (req.body.commune || '').trim();
    const coords = (req.body.coordonnees || '').trim();
    let msg = '';
    if (nom && commune) {
        await pool.query(
            "INSERT INTO points_collecte (nom, commune, coordonnees) VALUES (?, ?, ?)",
            [nom, commune, coords]
        );
        msg = "Le nouveau bac de tri a été enregistré avec succès pour les citoyens !";
    }
    const common = await loadCommon(req);
    const [points] = await pool.query(
        "SELECT id, nom, commune, type FROM points_collecte ORDER BY id ASC"
    );
    res.render('configuration-communes', { ...common, points, msg });
});

app.listen(PORT, () => console.log(`EcoKin admin sur http://localhost:${PORT}`));
