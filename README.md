# VA Productions - CRM Commercial

Application web de gestion commerciale développée avec la stack MERN (MongoDB, Express, React, Node.js).

## 📋 Fonctionnalités

- **Dashboard** : Vue d'ensemble de l'activité (rendez-vous, factures récentes, statistiques)
- **Gestion des contacts** : Ajout, modification et suivi des clients et prospects
- **Calendrier** : Planification des rendez-vous avec synchronisation Google Calendar
- **Bons de commande** : Création rapide avec signature automatique en 3 étapes
- **Facturations** : Gestion des factures avec suivi des paiements et export CSV
- **Utilisateurs** : Système de rôles (admin/commercial) avec gestion des comptes
- **Statistiques** : Analyse des performances par support et période
- **Paramètres** : Profil utilisateur et signature d'entreprise (admin)

## 🚀 Technologies

**Frontend :** React 18, Vite, Tailwind CSS, Axios  
**Backend :** Node.js, Express, MongoDB, JWT  
**Outils :** PDFKit (génération PDF), Google Calendar API, React Signature Canvas

## 📦 Installation

```bash
# Installer les dépendances
cd client && npm install
cd ../server && npm install

# Configuration (.env dans server/)
MONGODBURL=mongodb+srv://...
SECRET=votre_secret
PORT=5000

# Lancer l'application
cd server && npm run dev  # Backend sur :5000
cd client && npm run dev  # Frontend sur :5173
```

## 🔑 Points clés

- **Signature virtuelle** : Signature client sur chaque PDF de bons de commandes et factures
- **Synchronisation Google** : Rendez-vous bidirectionnels avec Google Calendar
- **Export données** : Export CSV des factures et bons de commandes pour comptabilité
- **Sécurité** : Authentification JWT, mots de passe chiffrés, contrôle d'accès par rôle

---

**Projet SAE - IUT 2025**
