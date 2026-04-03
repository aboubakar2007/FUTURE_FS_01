'use strict';

// ─────────────────────────────────────────────
//  Environment
// ─────────────────────────────────────────────
require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const nodemailer   = require('nodemailer');
const rateLimit    = require('express-rate-limit');

// ─────────────────────────────────────────────
//  Config & Validation
// ─────────────────────────────────────────────
const PORT             = Number(process.env.PORT) || 3000;
const GMAIL_USER       = process.env.GMAIL_USER;
const GMAIL_APP_PASS   = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
const MAIL_TO          = process.env.MAIL_TO || GMAIL_USER;

const REQUIRED_ENV = ['GMAIL_USER', 'GMAIL_APP_PASSWORD', 'MAIL_TO'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`\n❌  Variables d'environnement manquantes : ${missing.join(', ')}`);
  console.error('   Copiez backend/.env.example → backend/.env et renseignez les valeurs.\n');
  process.exit(1);
}

// ─────────────────────────────────────────────
//  Origines CORS autorisées
// ─────────────────────────────────────────────
const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'null',          // fichiers ouverts directement dans le navigateur (origin: null)
];

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? [...DEFAULT_ORIGINS, ...process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())]
  : DEFAULT_ORIGINS;

// ─────────────────────────────────────────────
//  Nodemailer — transporter Gmail
// ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASS,
  },
});

// Vérification de la connexion SMTP au démarrage (non bloquante)
transporter.verify()
  .then(() => console.log('✅  Connexion Gmail SMTP OK'))
  .catch(err => console.warn('⚠️   SMTP verify :', err.message));

// ─────────────────────────────────────────────
//  Express — setup
// ─────────────────────────────────────────────
const app = express();

// Trust reverse-proxy headers (Render, Railway, etc.)
app.set('trust proxy', 1);

// JSON body parser
app.use(express.json({ limit: '10kb' }));

// CORS
app.use(cors({
  origin(origin, cb) {
    // Autorise les requêtes sans origin (Postman, curl, etc.) en dev
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS bloqué pour l'origine : ${origin}`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

// Preflight global
app.options('*', cors());

// ─────────────────────────────────────────────
//  Rate limiting — /send-mail
// ─────────────────────────────────────────────
const contactLimiter = rateLimit({
  windowMs : 15 * 60 * 1000, // 15 minutes
  max      : 5,
  message  : {
    success : false,
    error   : 'Trop de requêtes. Veuillez patienter 15 minutes avant de réessayer.',
  },
  standardHeaders : true,
  legacyHeaders   : false,
});

// ─────────────────────────────────────────────
//  Helpers — validation
// ─────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactPayload(body) {
  const { nom, email, message } = body ?? {};
  const errors = [];

  if (!nom    || typeof nom    !== 'string' || nom.trim().length    < 2)   errors.push('Nom invalide (2 caractères minimum).');
  if (!email  || typeof email  !== 'string' || !EMAIL_REGEX.test(email.trim())) errors.push('Adresse e-mail invalide.');
  if (!message|| typeof message!== 'string' || message.trim().length < 10) errors.push('Message trop court (10 caractères minimum).');

  // Longueurs maximales (prévention abus)
  if (nom     && nom.trim().length     > 100)  errors.push('Nom trop long (100 caractères max).');
  if (email   && email.trim().length   > 254)  errors.push('E-mail trop long.');
  if (message && message.trim().length > 5000) errors.push('Message trop long (5 000 caractères max).');

  return errors;
}

// ─────────────────────────────────────────────
//  Routes
// ─────────────────────────────────────────────

/** GET /health — sanity check */
app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

/** POST /send-mail — formulaire de contact */
app.post('/send-mail', contactLimiter, async (req, res) => {
  const errors = validateContactPayload(req.body);
  if (errors.length) {
    return res.status(400).json({ success: false, error: errors.join(' ') });
  }

  const nom     = req.body.nom.trim();
  const email   = req.body.email.trim().toLowerCase();
  const message = req.body.message.trim();

  const mailOptions = {
    from    : `"Portfolio Contact" <${GMAIL_USER}>`,
    to      : MAIL_TO,
    replyTo : email,
    subject : `[Portfolio] Nouveau message de ${nom}`,
    text    : `Nom    : ${nom}\nEmail  : ${email}\n\n${message}`,
    html    : `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:12px;">
        <h2 style="color:#a78bfa;margin-top:0;">📬 Nouveau message — Portfolio</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <tr>
            <td style="padding:8px 12px;background:#1e293b;border-radius:6px 6px 0 0;color:#94a3b8;width:100px;font-weight:bold;">Nom</td>
            <td style="padding:8px 12px;background:#1e293b;border-radius:0 6px 0 0;">${escapeHtml(nom)}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;background:#162032;color:#94a3b8;font-weight:bold;">Email</td>
            <td style="padding:8px 12px;background:#162032;">
              <a href="mailto:${escapeHtml(email)}" style="color:#a78bfa;">${escapeHtml(email)}</a>
            </td>
          </tr>
        </table>
        <div style="background:#1e293b;padding:16px;border-radius:6px;border-left:4px solid #a78bfa;white-space:pre-wrap;line-height:1.6;">
          ${escapeHtml(message)}
        </div>
        <p style="color:#475569;font-size:12px;margin-top:16px;">
          Envoyé via le formulaire de contact du portfolio · ${new Date().toLocaleString('fr-FR')}
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧  Message envoyé de ${nom} <${email}>`);
    return res.json({ success: true, message: 'Votre message a bien été envoyé. Merci !' });
  } catch (err) {
    console.error('❌  Erreur envoi e-mail :', err.message);
    return res.status(500).json({ success: false, error: 'Erreur lors de l\'envoi. Veuillez réessayer.' });
  }
});

// ─────────────────────────────────────────────
//  404 catch-all
// ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route introuvable.' });
});

// ─────────────────────────────────────────────
//  Global error handler
// ─────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({ success: false, error: err.message });
  }
  console.error('Erreur serveur :', err);
  res.status(500).json({ success: false, error: 'Erreur interne du serveur.' });
});

// ─────────────────────────────────────────────
//  Start
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  Backend Portfolio démarré`);
  console.log(`   ➜ API     : http://localhost:${PORT}`);
  console.log(`   ➜ Health  : http://localhost:${PORT}/health`);
  console.log(`   ➜ Mail to : ${MAIL_TO}\n`);
});

// ─────────────────────────────────────────────
//  Utility
// ─────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
