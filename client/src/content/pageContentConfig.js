export const PAGE_CONTENT_CONFIG = {
  dashboard: {
    label: "Dashboard",
    defaults: {
      title: "",
      text: "Bienvenue sur l'application de V.A Productions",
    },
    fields: {
      title: { label: "Titre (optionnel)", type: "text" },
      text: { label: "Texte d'accueil", type: "textarea" },
    },
  },
  contacts: {
    label: "Contacts",
    defaults: {
      title: "Contacts",
      text: "Retrouvez la liste de tous les contacts enregistrés",
      searchPlaceholder: "Rechercher un contact",
      addContactButtonLabel: "Ajouter un contact",
    },
    fields: {
      title: { label: "Titre", type: "text" },
      text: { label: "Texte", type: "textarea" },
      searchPlaceholder: { label: "Placeholder recherche", type: "text" },
      addContactButtonLabel: { label: "Label bouton (Ajouter)", type: "text" },
    },
  },
  invoice: {
    label: "Facturation",
    defaults: {
      listTitle: "Liste des factures",
      listSubtitle: "Voici la liste de toutes les factures crées !",
      searchPlaceholder: "Rechercher un client",
      filterButtonLabel: "Filtrer",
    },
    fields: {
      listTitle: { label: "Titre de section", type: "text" },
      listSubtitle: { label: "Sous-titre", type: "textarea" },
      searchPlaceholder: { label: "Placeholder recherche", type: "text" },
      filterButtonLabel: { label: "Label bouton (Filtrer)", type: "text" },
    },
  },
  order: {
    label: "Bon de commande",
    defaults: {
      title: "Bon de commandes crées",
      text: "Voici la liste de tous les bons des commandes crées (en cours et validés)",
      createOrderButtonLabel: "Créer une commande",
    },
    fields: {
      title: { label: "Titre", type: "text" },
      text: { label: "Texte", type: "textarea" },
      createOrderButtonLabel: { label: "Label bouton (Créer)", type: "text" },
    },
  },
  stats: {
    label: "Statistiques",
    defaults: {
      revenueLabel: "Revenu",
      invoicesLabel: "Factures",
      lastOrderLabel: "Dernière commande",
      exportButtonLabelPrefix: "Exporter les données de",
    },
    fields: {
      revenueLabel: { label: "Label: Revenu", type: "text" },
      invoicesLabel: { label: "Label: Factures", type: "text" },
      lastOrderLabel: { label: "Label: Dernière commande", type: "text" },
      exportButtonLabelPrefix: { label: "Bouton export (prefix)", type: "text" },
    },
  },
  accountingCharges: {
    label: "Comptabilité — Saisie des charges",
    defaults: {
      thAccount: "Compte (6 chiffres)",
      thName: "Nom du compte",
      thPrevious: "Montant précédent (€)",
      thPlanned: "Montant prévu (€)",
      thActions: "Actions",

      tfootTotalEntries: "Total des saisies",
      tfootResultAmount: "Montant issu du compte de résultat",
      tfootControl: "Contrôle reste à saisir / trop saisi",
      tfootGap: "Ecart exercice en cours et précédent",
    },
    fields: {
      thAccount: { label: "Tableau: Compte", type: "text" },
      thName: { label: "Tableau: Nom du compte", type: "text" },
      thPrevious: { label: "Tableau: Montant précédent", type: "text" },
      thPlanned: { label: "Tableau: Montant prévu", type: "text" },
      thActions: { label: "Tableau: Actions", type: "text" },

      tfootTotalEntries: { label: "Pied de tableau: Total des saisies", type: "text" },
      tfootResultAmount: { label: "Pied de tableau: Montant résultat", type: "text" },
      tfootControl: { label: "Pied de tableau: Contrôle", type: "text" },
      tfootGap: { label: "Pied de tableau: Écart", type: "text" },
    },
  },
  accountingResult: {
    label: "Comptabilité — Compte de résultat",
    defaults: {
      thAccount: "Compte (6 chiffres)",
      thName: "Nom du compte",
      thAmount: "Montant (€)",
      thActions: "Actions",
      tfootTotal: "Total",
    },
    fields: {
      thAccount: { label: "Tableau: Compte", type: "text" },
      thName: { label: "Tableau: Nom du compte", type: "text" },
      thAmount: { label: "Tableau: Montant", type: "text" },
      thActions: { label: "Tableau: Actions", type: "text" },
      tfootTotal: { label: "Pied de tableau: Total", type: "text" },
    },
  },
  magazine: {
    label: "Magazines",
    defaults: {
      headerTitle: "Gestion des Magazines",
      headerSubtitle: "Créez et gérez les magazines disponibles",
      newMagazineButtonLabel: "Nouveau Magazine",
      editLabel: "Modifier",
      createLabel: "Créer",
      cancelLabel: "Annuler",
      loadingLabel: "Chargement...",
      emptyLabel: "Aucun magazine créé pour le moment",
    },
    fields: {
      headerTitle: { label: "Titre", type: "text" },
      headerSubtitle: { label: "Sous-titre", type: "textarea" },
      newMagazineButtonLabel: { label: "Bouton: Nouveau magazine", type: "text" },
      editLabel: { label: "Label: Modifier", type: "text" },
      createLabel: { label: "Label: Créer", type: "text" },
      cancelLabel: { label: "Label: Annuler", type: "text" },
      loadingLabel: { label: "Texte: Chargement", type: "text" },
      emptyLabel: { label: "Texte: Aucun magazine", type: "text" },
    },
  },
  guide: {
    label: "Guide",
    defaults: {
      downloadPdfLabel: "Télécharger le Guide PDF",
    },
    fields: {
      downloadPdfLabel: { label: "Bouton: Télécharger PDF", type: "text" },
    },
  },
  layout: {
    label: "Interface (Global)",
    defaults: {
      appName: "V.A. Productions",
      menuLabel: "MENU",
      dashboardLinkLabel: "Dashboard",
      contactsLinkLabel: "Contacts",
      ordersLinkLabel: "Commandes",
      invoiceLinkLabel: "Facturation",
      calendarLinkLabel: "Calendrier",

      adminSectionLabel: "Administration",
      manageUsersLinkLabel: "Gestion Utilisateur",
      accountingLinkLabel: "Comptabilité",
      magazinesLinkLabel: "Magazines",
      statsLinkLabel: "Statistiques",

      logoutTooltip: "Déconnexion",
      settingsTooltip: "Paramètres",
      guideTooltip: "Guide d'utilisation",
    },
    fields: {
      appName: { label: "Nom affiché (header/navbar)", type: "text" },
      menuLabel: { label: "Titre du menu", type: "text" },
      dashboardLinkLabel: { label: "Lien: Dashboard", type: "text" },
      contactsLinkLabel: { label: "Lien: Contacts", type: "text" },
      ordersLinkLabel: { label: "Lien: Commandes", type: "text" },
      invoiceLinkLabel: { label: "Lien: Facturation", type: "text" },
      calendarLinkLabel: { label: "Lien: Calendrier", type: "text" },
      adminSectionLabel: { label: "Section Admin: titre", type: "text" },
      manageUsersLinkLabel: { label: "Admin: Gestion utilisateur", type: "text" },
      accountingLinkLabel: { label: "Admin: Comptabilité", type: "text" },
      magazinesLinkLabel: { label: "Admin: Magazines", type: "text" },
      statsLinkLabel: { label: "Admin: Statistiques", type: "text" },
      logoutTooltip: { label: "Tooltip: Déconnexion", type: "text" },
      settingsTooltip: { label: "Tooltip: Paramètres", type: "text" },
      guideTooltip: { label: "Tooltip: Guide", type: "text" },
    },
  },
};

export const PAGE_KEYS = Object.keys(PAGE_CONTENT_CONFIG);
