# Guide de déploiement (Render + Vercel + MongoDB Atlas)

Ce document explique comment déployer **VA Productions - CRM Commercial** en production avec :

- **MongoDB Atlas** (base de données)
- **Render** (API Node/Express)
- **Vercel** (frontend React/Vite)
- **MongoDB Compass** (outil local pour administrer Atlas)

> L'objectif est de permettre aux futurs étudiants de déployer l’app très rapidement.


## 1) Architecture (résumé)

- **Frontend** : dossier `client/` (React + Vite)
- **Backend** : dossier `server/` (Express)
- **DB** : MongoDB Atlas

Le frontend appelle l’API via la variable :
- `VITE_API_HOST` (ex: `https://<ton-backend>.onrender.com`)

Le backend applique une politique CORS basée sur :
- `FRONT_LINK` (doit correspondre exactement à l’origin Vercel, ex: `https://<front>.vercel.app`)

---

## 2) MongoDB Atlas (création + connexion)

### 2.1 Créer un cluster
1. Aller sur MongoDB Atlas, créer un **Project**.
2. Créer un **Cluster** (Shared/Free convient pour démarrer).

### 2.2 Créer un utilisateur DB
1. **Database Access** → **Add New Database User**
2. Donner un user/password (mot de passe fort pour la sécurité).

### 2.3 Autoriser les connexions (Network Access)
- En dev : autoriser **ton IP**.
- En prod : Render sort avec des IPs variables → le plus simple est `0.0.0.0/0`.
  - Important : uniquement si le mot de passe est fort.

### 2.4 Récupérer l’URI Mongo
Dans Atlas → **Connect** → **Drivers** (Node.js) → copier une URI de ce type :

- `mongodb+srv://<USER>:<PASSWORD>@<CLUSTER_HOST>/<DB_NAME>?retryWrites=true&w=majority`

Cette valeur sera utilisée côté backend dans `MONGODBURL`.

---

## 3) MongoDB Compass (admin de la base)

### 3.1 Installer Compass
- Télécharger MongoDB Compass depuis le site officiel MongoDB.

### 3.2 Se connecter au cluster Atlas
1. Dans Atlas → **Connect** → **Compass** → copier le lien.
2. Dans Compass → coller l’URI.
3. Remplacer `<password>` si nécessaire.
4. Connecter.

### 3.3 Collections attendues
Le backend crée/alimente des collections comme :
- `users`, `contacts`, `orders`, `invoices`, `events`, `magazines`, `signatures`, `charges` (selon usage).

---

## 4) Déployer le backend sur Render (Express)

### 4.1 Créer un service
1. Render → **New** → **Web Service**
2. Connecter le repo GitHub/Git.
3. Sélectionner la branche à déployer.

Réglages conseillés :
- **Root Directory** : `server`
- **Environment** : Node
- **Build Command** : `npm install`
- **Start Command** : `npm start`

> Le serveur écoute sur `process.env.PORT` (Render fournit automatiquement `PORT`).

### 4.2 Variables d’environnement (Render)
Dans Render → **Environment** ajouter :

**Obligatoires**
- `MONGODBURL` : URI Atlas complète
- `SECRET` : secret JWT (long et aléatoire)
- `FRONT_LINK` : URL Vercel (origin exacte, sans slash final) ex: `https://va-productions.vercel.app`

**Selon fonctionnalités**
- Emails (Brevo) :
  - `BREVO_API_KEY`
  - `BREVO_SENDER_EMAIL`
  - `BREVO_SENDER_NAME` (optionnel)
- Google Calendar :
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI` (optionnel, sinon calculé automatiquement)
- Factur-X :
  - `VAPRODUCTIONS_SIRET`
  - `VAPRODUCTIONS_VAT`

### 4.3 CORS (point critique)
Le backend autorise uniquement :
- l’URL définie dans `FRONT_LINK`
- `http://localhost:5173` et `http://localhost:5174` (si 5173 est déjà occupé)

Si `FRONT_LINK` ne correspond pas exactement à l’origin Vercel, tu auras une erreur CORS.

### 4.4 Stockage des fichiers (PDF signés / factures)
Le backend écrit sur le disque :
- factures PDF : dossier `server/invoices/` (créé à l’exécution)
- bons signés : `server/uploads/orders/`

Sur Render, le filesystem peut être réinitialisé lors de certains déploiements.
Recommandations :
- Pour **garder ces fichiers** : activer un **Persistent Disk** Render (à monter de façon à couvrir `server/invoices` et `server/uploads`).
- Alternative robuste : migrer ces fichiers vers un stockage objet (S3, Cloudinary, etc.).

### 4.5 URL de l’API
Une fois déployé, Render donne une URL :
- `https://<service>.onrender.com`

Cette URL est à utiliser côté Vercel dans `VITE_API_HOST`.

---

## 5) Déployer le frontend sur Vercel (Vite)

### 5.1 Créer un projet Vercel
1. Vercel → **New Project** → importer le repo.
2. Choisir les réglages :
   - **Root Directory** : `client`
   - **Framework Preset** : Vite (auto)
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`

Le fichier `client/vercel.json` gère la réécriture SPA (routes React).

### 5.2 Variables d’environnement (Vercel)
Dans Vercel → **Settings → Environment Variables** :

- `VITE_API_HOST` : URL Render du backend (ex: `https://<service>.onrender.com`)

**Selon fonctionnalités**
- Google Calendar (côté client) :
  - `VITE_CLIENT_ID_CALENDAR`
  - `VITE_API_KEY_CALENDAR`
  - `VITE_CALENDAR_ID` (souvent `primary`)
  - `VITE_SCOPES` (ex: `https://www.googleapis.com/auth/calendar.events`)

> Les variables `VITE_*` sont intégrées au bundle frontend : elles sont visibles côté navigateur.

### 5.3 Finir le chaînage Render ↔ Vercel
1. Une fois Vercel déployé, copier l’URL (ex: `https://<projet>.vercel.app`).
2. Dans Render, mettre à jour `FRONT_LINK` avec cette URL.
3. Redéployer le backend Render.

---

## 6) Vérifications post-déploiement (checklist)

- Front charge correctement (routes SPA OK).
- Login OK (JWT, API accessible).
- Accès API sans erreur CORS.
- Création/lecture de contacts, factures, commandes.
- Statistiques chargent les factures.
- Google Calendar : auth URL + callback fonctionnent (si activé).
- Génération PDF : facture téléchargeable, bon signé accessible.

---

## 7) Déploiement “préprod” / multi-environnements (conseil)

Si vous avez plusieurs environnements :
- 1 projet Vercel par environnement (ou Preview Deployments)
- 1 service Render par environnement
- 1 base Atlas par environnement (ou au minimum une DB séparée dans le même cluster)

⚠️ Attention :
Si vous utilisez les Preview Deployments Vercel, il faudra soit :
- ajouter leurs origins au backend, soit
- désactiver les previews, soit
- adapter la stratégie CORS.

Si vous vous partager les .env entre développeur, faite attention à que vos url ne se modifie pas :
Cas fréquent : 
- VITE_API_HOST=http://localhost:5555 -> VITE_API_HOST=http://localhost:5555/
