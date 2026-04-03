# 🚀 Portfolio Professionnel — Full Stack (HTML, CSS, JS + Node.js)

> Site portfolio personnel **moderne**, **responsive** et **haute performance**, avec envoi des messages de contact vers **Gmail** via une API **Node.js** (Express + Nodemailer).  
> Aucune base de données : les messages transitent uniquement par e-mail.

---

## 📐 Architecture du projet

```
portfolio/
├── frontend/
│   ├── index.html        # SPA — sections : Hero, À propos, Compétences, Projets, Contact, Footer
│   ├── style.css         # Thème sombre premium, glassmorphism, animations, responsive (mobile-first)
│   └── script.js         # Navigation sticky, reveal au scroll (IntersectionObserver), POST JSON → API
├── backend/
│   ├── server.js         # Express, POST /send-mail, Nodemailer (Gmail SMTP), rate-limiting
│   ├── package.json      # Dépendances Node
│   └── .env.example      # Modèle de variables d'environnement (à copier en .env)
└── README.md             # Ce fichier
```

---

## 🛠 Stack Technologique

| Couche     | Technologie                                                          |
|------------|----------------------------------------------------------------------|
| Frontend   | HTML5 sémantique, CSS3 (Flexbox, Grid, variables CSS), JS (fetch)    |
| Backend    | Node.js ≥ 18, Express 4, Nodemailer, CORS, express-rate-limit        |
| Config     | dotenv, variables d'environnement, `.env.example`                    |
| Design     | Thème sombre, glassmorphism, micro-animations, responsive mobile-first |

---

## ⚡ Installation & Démarrage

### 1 — Prérequis

- **Node.js ≥ 18** — [nodejs.org](https://nodejs.org)
- Un compte **Gmail** avec validation en deux étapes activée

### 2 — Cloner / télécharger le projet

```bash
git clone <url-du-repo>
cd portfolio
```

### 3 — Backend : installation des dépendances

```bash
cd backend
npm install
```

### 4 — Configurer Gmail (mot de passe d'application)

> ⚠️ Ne jamais utiliser votre mot de passe Gmail principal dans le code.

1. Activez la **validation en deux étapes** :  
   [Compte Google → Sécurité → Validation en 2 étapes](https://myaccount.google.com/signinoptions/two-step-verification)

2. Créez un **mot de passe d'application** :  
   [Compte Google → Sécurité → Mots de passe des applications](https://myaccount.google.com/apppasswords)  
   - Nom du service : `Portfolio` (ou ce que vous souhaitez)
   - Google génère un mot de passe à **16 caractères** (affiché par groupes de 4).

3. Copiez ce mot de passe pour l'étape suivante.

### 5 — Créer le fichier `.env`

Dans le dossier `backend/`, copiez le modèle :

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Puis éditez `.env` :

```env
# === Gmail ===
GMAIL_USER=votre.adresse@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   # espaces autorisés (retirés côté serveur)

# === Destinataire des messages ===
MAIL_TO=votre.adresse@gmail.com          # peut être la même que GMAIL_USER

# === Serveur ===
PORT=3000

# === CORS (optionnel) ===
# Ajoutez ici les origines de votre frontend si elles diffèrent des valeurs par défaut
# ALLOWED_ORIGINS=http://127.0.0.1:5500,http://localhost:5173
```

| Variable           | Description                                                   |
|--------------------|---------------------------------------------------------------|
| `GMAIL_USER`       | Adresse Gmail utilisée pour **envoyer** les e-mails           |
| `GMAIL_APP_PASSWORD` | Mot de passe d'application Gmail (16 caractères)            |
| `MAIL_TO`          | Adresse qui **reçoit** les messages du formulaire             |
| `PORT`             | Port du serveur Express (défaut : `3000`)                     |
| `ALLOWED_ORIGINS`  | Origines CORS autorisées (séparées par des virgules)          |

### 6 — Lancer le serveur

```bash
cd backend
node server.js
```

Le serveur écoute sur **http://localhost:3000**

#### Endpoints disponibles

| Méthode | Route        | Description                                    |
|---------|--------------|------------------------------------------------|
| `GET`   | `/health`    | Vérifie que le serveur répond (`{ ok: true }`) |
| `POST`  | `/send-mail` | Envoie un e-mail via Nodemailer                |

**Corps de la requête POST `/send-mail`** (JSON) :

```json
{
  "nom": "Jean Dupont",
  "email": "jean@example.com",
  "message": "Bonjour, je vous contacte au sujet de..."
}
```

**Réponse succès** :
```json
{ "success": true, "message": "E-mail envoyé avec succès." }
```

**Réponse erreur** :
```json
{ "success": false, "error": "Description de l'erreur." }
```

### 7 — Frontend

Deux options :

**Option A — Extension VS Code Live Server**  
Clic droit sur `frontend/index.html` → *Open with Live Server* (écoute par défaut sur `http://127.0.0.1:5500`).

**Option B — Ouverture directe**  
Double-clic sur `frontend/index.html` (l'origine sera `file://`, pensez à l'ajouter à `ALLOWED_ORIGINS` si besoin).

> La constante `API_BASE_URL` dans `frontend/script.js` pointe par défaut sur `http://localhost:3000`.  
> Modifiez-la si votre API est hébergée ailleurs.

---

## 🔄 Fonctionnement du formulaire de contact

```
[Visiteur]
    │
    ▼ Remplit nom + email + message, clique "Envoyer"
[Frontend JS]
    │ fetch POST /send-mail (JSON)
    ▼
[Express API]
    │ Validation des champs (nom, email, message)
    │ Rate-limiting (5 req / 15 min / IP)
    ▼
[Nodemailer → Gmail SMTP]
    │ Envoie l'e-mail à MAIL_TO
    │ Reply-To = adresse du visiteur
    ▼
[Vous recevez l'e-mail] ✉️
```

---

## 🔒 Sécurité

- **Rate limiting** : 5 requêtes maximum toutes les 15 minutes par IP sur `/send-mail`.
- **Validation serveur** : présence et format de tous les champs (regex email).
- **Variables d'environnement** : aucune clé sensible dans le code source.
- **`.env` dans `.gitignore`** : le fichier de secrets n'est jamais versionné.
- **CORS restrictif** : seules les origines explicitement autorisées peuvent appeler l'API.

---

## 🚀 Déploiement

### Backend (Render / Railway / Fly.io)

1. Déployez le dossier `backend/` comme un **Web Service Node**.
2. Définissez les variables d'environnement (`GMAIL_USER`, `GMAIL_APP_PASSWORD`, `MAIL_TO`, `PORT`) directement dans le dashboard de la plateforme.
3. Mettez à jour `API_BASE_URL` dans `frontend/script.js` avec l'URL publique du backend.

### Frontend (Netlify / Vercel / GitHub Pages)

Déployez le dossier `frontend/` comme un site statique.

---

## 🧩 Améliorations possibles

| Amélioration                | Description                                                        |
|-----------------------------|--------------------------------------------------------------------|
| **Honeypot / reCAPTCHA**    | Ajouter un champ caché côté formulaire pour bloquer les bots       |
| **Validation HTML5**        | Attributs `required`, `type="email"`, `maxlength` côté client      |
| **Sanitization**            | Nettoyer le contenu des champs avant envoi si ajout de texte riche |
| **Tests automatisés**       | Jest (unité) + Supertest (intégration API)                         |
| **CI/CD**                   | GitHub Actions : lint, test, déploiement automatique               |
| **HTTPS local**             | `mkcert` pour tester HTTPS en développement                        |
| **Internationalisation**    | i18n pour supporter plusieurs langues                              |

---

## 📄 Licence

Projet éducatif / portfolio personnel.  
Adaptez librement le contenu (nom, textes, projets, liens) à votre profil.

---

*Built with ❤️ — Senior Full Stack approach*
