// Central registry for page keys shown in the Settings editor dropdown.
// Keys must match the server validation: /^[a-z0-9][a-z0-9._-]*$/

export const PAGE_REGISTRY = [
  { key: "layout", label: "Interface (Global)" },

  // Public (not logged)
  { key: "login", label: "Connexion" },
  { key: "forgot-password", label: "Mot de passe oublié" },
  { key: "reset-password", label: "Réinitialisation mot de passe" },
  { key: "user-verify", label: "Vérification utilisateur" },

  // Main app
  { key: "dashboard", label: "Dashboard" },
  { key: "calendrier", label: "Calendrier" },
  { key: "contacts", label: "Contacts" },
  { key: "order", label: "Bons de commande" },
  { key: "invoice", label: "Factures" },
  { key: "invoice-create", label: "Créer une facture" },
  { key: "settings", label: "Paramètres" },
  { key: "guide", label: "Guide" },

  // Admin
  { key: "admin-user", label: "Admin: Utilisateurs" },
  { key: "admin-stats", label: "Admin: Statistiques" },
  { key: "admin-magazine", label: "Admin: Magazines" },
  { key: "admin-charge", label: "Admin: Comptabilité" },
];

export const PAGE_REGISTRY_KEYS = PAGE_REGISTRY.map((p) => p.key);

export const getPageLabel = (pageKey) => {
  const hit = PAGE_REGISTRY.find((p) => p.key === pageKey);
  return hit?.label || pageKey;
};
