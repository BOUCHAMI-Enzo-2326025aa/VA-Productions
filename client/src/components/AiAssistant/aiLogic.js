import axios from "axios";
import Fuse from "fuse.js";

const getUserRole = () => {
  try {
    const storedString = localStorage.getItem("user");
    if (!storedString) return { isAdmin: false };
    const storedData = JSON.parse(storedString);
    const user = storedData.user || storedData;
    const normalizedRole = String(user.role || "").trim().toLowerCase();
    return { isAdmin: normalizedRole === 'admin' };
  } catch {
    return { isAdmin: false };
  }
};

const normalizeText = (text) => {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
    .replace(/['']/g, "'") // Normalise les apostrophes
    .replace(/\s+/g, " ") // Normalise les espaces
    .replace(/[^\w\s'-]/g, ""); 
};

// Extraction du terme de recherche
const extractSearchTerm = (text, keywords) => {
  let cleaned = text;
  keywords.forEach(kw => {
    cleaned = cleaned.replace(new RegExp(`\\b${kw}\\b`, 'gi'), '');
  });
  return cleaned.trim();
};

// BASE DE CONNAISSANCES

const intentsDatabase = [
  // NAVIGATION - Contacts
  {
    id: "nav_contacts",
    examples: [
      "contacts", "clients", "liste des contacts", "liste des clients", "liste clients",
      "voir les contacts", "voir les clients", "afficher contacts", "afficher clients",
      "montre contacts", "montre clients", "aller aux contacts", "aller aux clients",
      "va aux contacts", "ouvre contacts", "ouvrir contacts", "page contacts",
      "mes contacts", "mes clients", "tous les contacts", "voir mes clients",
      "je veux voir la liste des contacts", "je veux voir mes clients",
      "montre moi la liste des contacts", "affiche la liste des clients"
    ],
    response: "📂 Ouverture des contacts...",
    action: "/contacts"
  },

  // NAVIGATION - Factures
  {
    id: "nav_invoices",
    examples: [
      "factures", "liste factures", "voir factures", "afficher factures",
      "montre factures", "aller factures", "va aux factures", "ouvre factures",
      "page factures", "mes factures", "toutes les factures", "voir les factures",
      "voir mes factures", "afficher les factures"
    ],
    response: "💶 Direction les factures...",
    action: "/invoice"
  },

  // RECHERCHE - Factures impayées 
  {
    id: "search_unpaid_invoices",
    examples: [
      "factures impayées", "factures impayees", "facture impayée",
      "factures en retard", "factures non payées", "factures non payees",
      "facture en retard", "facture non payée", "impayés", "impayes",
      "factures à payer", "factures dues"
    ],
    response: null,
    special: "unpaid_invoices"
  },

  // RECHERCHE - Factures payées 
  {
    id: "search_paid_invoices",
    examples: [
      "factures payées", "factures payees", "facture payée",
      "factures réglées", "factures reglees", "facture réglée",
      "factures encaissées", "factures encaissees", "payés", "payes",
      "combien de factures payées", "nombre factures payées"
    ],
    response: null,
    special: "paid_invoices"
  },

  // NAVIGATION - Commandes
  {
    id: "nav_orders",
    examples: [
      "commandes", "bons de commande", "liste commandes", "voir commandes",
      "afficher commandes", "montre commandes", "aller commandes", "va aux commandes",
      "ouvre commandes", "page commandes", "mes commandes", "toutes les commandes"
    ],
    response: "🛒 Voici les commandes...",
    action: "/order"
  },

  // NAVIGATION - Calendrier
  {
    id: "nav_calendar",
    examples: [
      "calendrier", "agenda", "rdv", "rendez vous", "planning",
      "voir calendrier", "afficher calendrier", "montre calendrier",
      "aller calendrier", "va au calendrier", "ouvre calendrier",
      "mes rendez vous", "mes rdv", "voir mon calendrier", "voir mon agenda",
      "montre moi mes rendez vous", "affiche mon agenda", "voir mes rendez vous",
      "j aimerais voir mon calendrier", "j aimerais aller voir mon calendrier",
      "montre mes rdv", "afficher mes rendez vous"
    ],
    response: "📅 Ouverture du calendrier...",
    action: "/calendrier"
  },

  // NAVIGATION - Dashboard
  {
    id: "nav_dashboard",
    examples: [
      "dashboard", "accueil", "tableau de bord", "home",
      "aller accueil", "retour accueil", "page principale"
    ],
    response: "🏠 Retour à l'accueil...",
    action: "/dashboard"
  },

  // NAVIGATION - Paramètres
  {
    id: "nav_settings",
    examples: [
      "parametres", "reglages", "settings", "configuration",
      "voir parametres", "aller parametres", "ouvre parametres"
    ],
    response: "⚙️ Ouverture des paramètres...",
    action: "/settings"
  },

  // NAVIGATION - Guide
  {
    id: "nav_guide",
    examples: [
      "guide", "aide", "documentation", "tutoriel", "help",
      "voir guide", "ouvrir guide", "guide utilisateur"
    ],
    response: "📚 Voici le guide utilisateur...",
    action: "/guide"
  },

  // NAVIGATION ADMIN - Stats
  {
    id: "nav_stats_admin",
    examples: [
      "statistiques", "stats", "chiffres", "donnees",
      "voir stats", "afficher stats", "aller stats"
    ],
    response: "📊 Statistiques...",
    action: "/admin/stats",
    adminOnly: true
  },

  // NAVIGATION ADMIN - Compta
  {
    id: "nav_accounting_admin",
    examples: [
      "compta", "comptabilite", "charges",
      "voir compta", "aller compta"
    ],
    response: "💰 Comptabilité...",
    action: "/admin/charge",
    adminOnly: true
  },

  // NAVIGATION ADMIN - Magazines
  {
    id: "nav_magazines_admin",
    examples: [
      "magazines", "supports", "gestion magazines",
      "voir magazines", "aller magazines"
    ],
    response: "📚 Gestion des magazines...",
    action: "/admin/magazine",
    adminOnly: true
  },

  // NAVIGATION ADMIN - Utilisateurs
  {
    id: "nav_users_admin",
    examples: [
      "utilisateurs", "users", "gestion utilisateurs",
      "voir utilisateurs", "aller utilisateurs"
    ],
    response: "👥 Gestion des utilisateurs...",
    action: "/admin/user",
    adminOnly: true
  },

  // TUTORIELS - Facture 
  {
    id: "tuto_invoice",
    examples: [
      "comment créer facture", "comment créer une facture", "créer facture",
      "comment faire facture", "comment valider facture", "créer une facture",
      "aide facture", "tuto facture", "generer facture", "générer facture",
      "comment on crée une facture", "comment on créé une facture",
      "faire une facture", "nouvelle facture"
    ],
    response: "📄 Attention : Une facture ne se crée pas directement !\n\n1️⃣ Créez d'abord un Bon de Commande.\n2️⃣ Faites signer le client.\n3️⃣ Cliquez sur 'Valider' dans la liste des commandes.\n\n➡️ La facture sera générée automatiquement."
  },

  // TUTORIELS - Créer contact
  {
    id: "tuto_create_contact",
    examples: [
      "comment créer contact", "comment créer client", "comment ajouter contact",
      "comment faire contact", "créer contact comment", "comment nouveau contact",
      "aide créer contact", "tuto créer contact", "créer un contact",
      "comment créer un contact", "comment créer un client", "nouveau contact",
      "ajouter un contact", "ajouter un client"
    ],
    response: "📋 Créer un contact :\n1. Allez sur 'Contacts'.\n2. Cliquez sur 'Ajouter'.\n3. Remplissez : Entreprise, SIRET, TVA.\n\nVoulez-vous que je vous y emmène ?",
    context: { proposedAction: "/contacts" }
  },

  // TUTORIELS - Créer commande
  {
    id: "tuto_create_order",
    examples: [
      "comment créer commande", "comment faire commande", "comment nouvelle commande",
      "aide créer commande", "tuto commande", "créer commande comment",
      "comment bon de commande", "faire bon de commande", "créer une commande",
      "comment créer une commande", "nouvelle commande", "faire une commande",
      "comment on crée une commande", "comment on créé une commande",
      "comment faire une commande", "aide pour créer commande"
    ],
    response: "🛒 Créer une commande :\n\n1️⃣ Allez dans Commandes.\n2️⃣ Cliquez sur 'Créer une commande'.\n3️⃣ Sélectionnez un client et ajoutez des supports / produits.\n4️⃣ Faites signer le client.\n5️⃣ Cliquez sur Confirmer.\n\nJe vous y emmène ?",
    context: { proposedAction: "/order" }
  },

  // TUTORIELS - Paiement
  {
    id: "tuto_payment",
    examples: [
      "comment valider paiement", "comment payer facture", "comment encaisser",
      "valider paiement comment", "aide paiement", "marquer paye"
    ],
    response: "💰 Valider un paiement :\nAllez dans la page Factures, trouvez la facture en question et cliquez sur le bouton 'Valider' (icône ✅). Le statut passera de 'Non payé' à 'Payé'.\n\nJe vous emmène aux factures ?",
    context: { proposedAction: "/invoice" }
  },

  // TUTORIELS - Modifier contact
  {
    id: "tuto_edit_contact",
    examples: [
      "comment modifier contact", "comment modifier client", "editer contact",
      "changer contact", "modifier contact comment"
    ],
    response: "✏️ Modifier un contact :\nCliquez sur le contact dans la liste. Dans le panneau de détails, cliquez sur le bouton 'Modifier' en haut à droite pour corriger les informations."
  },

  // TUTORIELS - Changer mot de passe
  {
    id: "tuto_password",
    examples: [
      "comment changer mot de passe", "comment modifier mot de passe",
      "changer password", "modifier mdp", "nouveau mot de passe", "changer de mdp", "comment on change de mdp"
    ],
    response: "🔒 Changer le mot de passe :\nAllez dans Paramètres > Changer le mot de passe.\n\n📌 Règles :\n• 8 caractères minimum\n• 1 majuscule\n• 1 chiffre\n• 1 symbole\n\nOn y va ?",
    context: { proposedAction: "/settings" }
  },

  // INFO - Signature
  {
    id: "info_signature",
    examples: [
      "signature commande", "signer commande", "pourquoi signature",
      "signature obligatoire", "faire signer"
    ],
    response: "✍️ Signature de la commande :\n\nLa signature du client est obligatoire pour valider une commande.\n\n✔️ Sur tablette / écran lors de la création\n✔️ Ou en important un PDF signé plus tard via le bouton 'Action'"
  },

  // INFO - Google Calendar
  {
    id: "info_google_calendar",
    examples: [
      "google calendar", "synchronisation google", "synchro google",
      "connecter google calendar", "google agenda"
    ],
    response: "📅 Google Calendar :\nAllez sur la page Calendrier, cliquez sur le bouton bleu 'Connexion Google Calendar'. Vos RDV créés ici iront dans votre agenda Google.\n\nJe vous ouvre le calendrier ?",
    context: { proposedAction: "/calendrier" }
  },

  // INFO - Export CSV
  {
    id: "info_export_csv",
    examples: [
      "export csv", "exporter csv", "telecharger csv",
      "exporter donnees", "exporter factures csv"
    ],
    response: "📥 Export CSV :\n- Factures : Page Factures > Bouton 'Filtrer' > 'Exporter les factures'.\n- Statistiques (Admin) : Page Statistiques > 'Exporter les données (CSV)'.\n\nLe séparateur utilisé est le point-virgule (;)."
  },

  // INFO - PDF
  {
    id: "info_download_pdf",
    examples: [
      "telecharger pdf", "voir pdf", "ouvrir pdf",
      "pdf facture", "pdf commande"
    ],
    response: "📄 Télécharger un PDF :\nDans la liste des Commandes ou des Factures, cliquez simplement sur l'icône 'Œil' (voir) ou 'Flèche' (télécharger) sur la ligne correspondante. \n\n*Pensez à autoriser les pop-ups de votre navigateur !*"
  },

  // INFO - Prospect vs Client
  {
    id: "info_prospect_vs_client",
    examples: [
      "difference prospect client", "prospect ou client",
      "quest ce qu un prospect", "quest ce qu un client"
    ],
    response: "👥 Prospect vs Client :\n- Prospect : Une entreprise que vous démarchez mais qui n'a pas encore acheté (Badge Bleu).\n- Client : Une entreprise qui a déjà passé une commande (Badge Vert)."
  },

  // INFO - Modifier facture
  {
    id: "info_edit_invoice",
    examples: [
      "modifier facture", "changer facture", "editer facture",
      "corriger facture"
    ],
    response: "⚠️ Impossible de modifier une facture :\nPour des raisons comptables, une facture validée ne peut pas être modifiée.\n\nSi vous avez fait une erreur, vous devez corriger les infos du contact, puis refaire un bon de commande."
  },

  // PROBLEMES - Validation commande
  {
    id: "problem_validate_order",
    examples: [
      "impossible valider commande", "arrive pas valider commande",
      "peux pas valider commande", "erreur validation commande",
      "valider commande marche pas", "probleme validation commande",
      "bug validation commande", "j arrive pas à valider une commande",
      "je n arrive pas à valider une commande"
    ],
    response: "❌ Impossible de valider la commande :\n\n✍️ La signature du client est obligatoire pour valider une commande.\nVous pouvez la faire signer sur écran ou importer un PDF signé."
  },

  // PROBLEMES - Création commande
  {
    id: "problem_create_order",
    examples: [
      "impossible créer commande", "arrive pas créer commande",
      "peux pas créer commande", "erreur création commande",
      "créer commande marche pas", "probleme création commande",
      "bug création commande", "j arrive pas à créer une commande",
      "je n arrive pas à créer une commande"
    ],
    response: "❌ Impossible de créer la commande :\n\n👉 Vérifiez que :\n• un client est bien sélectionné\n• au moins un support / produit est ajouté\n\nℹ️ La signature n'est pas obligatoire à cette étape."
  },

  // PROBLEMES - Google Calendar
  {
    id: "problem_google_calendar",
    examples: [
      "probleme google calendar", "bug google calendar",
      "google calendar marche pas", "erreur google calendar",
      "arrive pas connecter google", "impossible google calendar"
    ],
    response: "🛠️ Problème Google Calendar :\n1. Vérifiez que votre navigateur ne bloque pas les pop-ups.\n2. Assurez-vous d'avoir cliqué sur 'Connecter Google Calendar'.\n3. Rappel : la synchro va du CRM vers Google, pas l'inverse !"
  },

  // AIDE GENERALE
  {
    id: "help_general",
    examples: [
      "aide", "help", "que peux tu faire", "quoi faire",
      "aide moi", "besoin aide", "commandes disponibles",
      "tu peux faire quoi", "comment tu peux aider",
      "liste des commandes", "fonctionnalites"
    ],
    response: null, // Sera géré par une fonction spéciale
    special: "help"
  },

  // SALUTATIONS
  {
    id: "greeting",
    examples: [
      "bonjour", "salut", "hello", "coucou", "hey", "hi",
      "ca va", "cava", "cc"
    ],
    response: "Bonjour ! 👋 Je peux vous aider à créer des factures, rechercher des clients ou naviguer dans l'application."
  },

  // REMERCIEMENTS
  {
    id: "thanks",
    examples: [
      "merci", "merci beaucoup", "super merci", "cool merci",
      "top merci", "parfait merci"
    ],
    response: "Avec plaisir ! 😊"
  },

  // ROLE
  {
    id: "my_role",
    examples: [
      "qui suis je", "mon role", "mes droits", "mon statut",
      "je suis qui", "quel est mon role"
    ],
    response: null, // Sera géré dynamiquement
    special: "role"
  }
];


// Préparation des données pour Fuse
const fuseData = intentsDatabase.flatMap(intent => 
  intent.examples.map(example => ({
    example: normalizeText(example),
    intent: intent
  }))
);

const fuse = new Fuse(fuseData, {
  keys: ['example'],
  threshold: 0.45, // Plus c'est bas, plus c'est strict (0-1) - augmenté pour plus de tolérance
  distance: 100,
  minMatchCharLength: 2,
  includeScore: true,
  ignoreLocation: true,
  findAllMatches: true
});


const searchClient = async (searchTerm) => {
  const apiHost = import.meta.env.VITE_API_HOST;
  
  if (!searchTerm) {
    return { text: "Quel client cherchez-vous ? Essayez 'Cherche client Microsoft'." };
  }

  try {
    const res = await axios.get(`${apiHost}/api/contact`);
    const contacts = res.data.contactList || [];
    const normalizedSearch = normalizeText(searchTerm);
    
    const results = contacts.filter(c => 
      normalizeText(c.company).includes(normalizedSearch) || 
      (c.name && normalizeText(c.name).includes(normalizedSearch))
    );

    if (results.length === 0) {
      return { text: `Aucun contact trouvé pour "${searchTerm}".` };
    }
    
    const list = results.slice(0, 3).map(c => `• ${c.company} (${c.status})`).join('\n');
    return { 
      text: `J'ai trouvé ${results.length} contact(s) :\n${list}\n\nOn va voir la liste ?`,
      context: { proposedAction: "/contacts" }
    };
  } catch (e) {
    return { text: "Erreur lors de la recherche des contacts." };
  }
};

const getOverdueInvoices = async () => {
  const apiHost = import.meta.env.VITE_API_HOST;
  try {
    const res = await axios.get(`${apiHost}/api/invoice/overdue`);
    const overdue = res.data || [];
    
    if (overdue.length === 0) {
      return { text: "🎉 Aucune facture en retard !" };
    }

    const total = overdue.reduce((sum, inv) => sum + inv.totalPrice, 0);
    return { 
      text: `⚠️ Il y a ${overdue.length} factures en retard pour un total de ${total.toFixed(2)}€.\n\nJe vous emmène voir ça ?`, 
      context: { proposedAction: "/invoice" }
    };
  } catch (e) {
    return { text: "Je n'ai pas réussi à récupérer les factures." };
  }
};

const getPaidInvoices = async () => {
  const apiHost = import.meta.env.VITE_API_HOST;
  try {
    const res = await axios.get(`${apiHost}/api/invoice`);
    const invoices = res.data || [];
    const paidInvoices = invoices.filter(inv => inv.status === "paid");

    if (paidInvoices.length === 0) {
      return { text: "📉 Aucune facture payée pour le moment." };
    }

    const total = paidInvoices.reduce((sum, inv) => sum + inv.totalPrice, 0);
    return { 
      text: `✅ Il y a ${paidInvoices.length} factures payées pour un total de ${total.toFixed(2)}€.\n\nJe vous emmène voir le détail ?`,
      context: { proposedAction: "/invoice" }
    };
  } catch (e) {
    return { text: "Impossible de récupérer les factures payées." };
  }
};


const handleProblems = (msg) => {
  const hasProblem = /(n ?arrive pas|n ?arrives pas|j ?arrive pas|impossible|erreur|bug|bloqu|marche pas|probleme|problème|fonctionne pas)/i.test(msg);
  if (!hasProblem) return null;

  const hasOrder = /(command|comand|bon)/i.test(msg);
  const hasValidate = /(valider|confirmer|validation|valid)/i.test(msg);
  const hasCreate = /(créer|creer|creation|création|faire|nouvelle?|ajouter|nouveau)/i.test(msg);

  // Problème validation commande
  if (hasOrder && hasValidate) {
    return {
      text: "❌ Impossible de valider la commande :\n\n✍️ La signature du client est obligatoire pour valider une commande.\nVous pouvez la faire signer sur écran ou importer un PDF signé."
    };
  }

  // Problème création commande
  if (hasOrder && hasCreate) {
    return {
      text: "❌ Impossible de créer la commande :\n\n👉 Vérifiez que :\n• un client est bien sélectionné\n• au moins un support / produit est ajouté\n\nℹ️ La signature n'est pas obligatoire à cette étape."
    };
  }

  // Problème Google Calendar
  if (/google/i.test(msg)) {
    return { 
      text: "🛠️ Problème Google Calendar :\n1. Vérifiez que votre navigateur ne bloque pas les pop-ups.\n2. Assurez-vous d'avoir cliqué sur 'Connecter Google Calendar'.\n3. Rappel : la synchro va du CRM vers Google, pas l'inverse !" 
    };
  }

  return null;
};

export const analyzeIntent = async (input, context = null) => {
  const { isAdmin } = getUserRole();
  const msg = input.toLowerCase().trim();
  const normalized = normalizeText(input);

  //GESTION DU CONTEXTE (OUI/NON) 
  if (context?.proposedAction) {
    // Réponse affirmative
    if (/^(oui|ok|d ?accord|yes|vas ?y|go|c ?est parti|super|top|ouais|yep|👍)$/i.test(msg)) {
      return {
        text: "C'est parti ! ✨",
        action: context.proposedAction
      };
    }
    
    // Réponse négative
    if (/^(non|no|nop|nan|pas besoin|annuler|laisse tomber)$/i.test(msg)) {
      return {
        text: "D'accord, pas de souci. Avez-vous besoin d'autre chose ? 😊"
      };
    }
  }

  // DETECTION DES PROBLEMES 
  const problemResponse = handleProblems(msg);
  if (problemResponse) return problemResponse;

  //  DETECTION PRIORITAIRE 
  // Forcer la détection de "créer facture"
  if (/(comment|aide|tuto|créer|creer|faire|generer|générer).*facture/i.test(msg) && 
      !/(cherche|trouve|recherche|montre|impaye|paye|retard)/i.test(msg)) {
    return {
      text: "📄 Attention : Une facture ne se crée pas directement !\n\n1️⃣ Créez d'abord un Bon de Commande.\n2️⃣ Faites signer le client.\n3️⃣ Cliquez sur 'Valider' dans la liste des commandes.\n\n➡️ La facture sera générée automatiquement."
    };
  }

  // RECHERCHE CLIENT
  if (/(cherche|trouve|recherche|montre).*(client|contact)/i.test(msg)) {
    const searchTerm = extractSearchTerm(msg, ['cherche', 'trouve', 'recherche', 'montre', 'client', 'contact', 'le', 'la', 'un', 'une']);
    return await searchClient(searchTerm);
  }

  //  RECHERCHE PAR SIMILARITE 
  const results = fuse.search(normalized);

  if (results.length > 0 && results[0].score < 0.45) {
    const matchedIntent = results[0].item.intent;

    // Vérification des droits admin
    if (matchedIntent.adminOnly && !isAdmin) {
      return { text: "⛔ Accès refusé. Cette fonctionnalité est réservée aux administrateurs." };
    }

    // Cas spéciaux
    if (matchedIntent.special === "help") {
      const adminTxt = isAdmin ? "\n🔐 Admin : 'Aller aux stats', 'Gérer les utilisateurs'" : "";
      return { 
        text: `Voici ce que je peux faire :\n\n❓ Questions : 'Comment créer une facture ?'\n🔍 Recherche : 'Cherche client Total', 'Factures impayées'\n🧭 Navigation : 'Aller au calendrier', 'Paramètres'${adminTxt}` 
      };
    }

    if (matchedIntent.special === "role") {
      return { 
        text: isAdmin 
          ? "🔐 Vous êtes connecté en tant qu'Administrateur. Vous avez accès à tout, y compris les stats et la compta." 
          : "👤 Vous êtes connecté en tant que Commercial. Vous pouvez gérer les contacts, commandes, factures et votre agenda." 
      };
    }

    if (matchedIntent.special === "unpaid_invoices") {
      return await getOverdueInvoices();
    }

    if (matchedIntent.special === "paid_invoices") {
      return await getPaidInvoices();
    }

    // Réponse standard
    return {
      text: matchedIntent.response,
      action: matchedIntent.action,
      context: matchedIntent.context
    };
  }


  // Si on a des résultats avec score moyen, proposer des suggestions
  if (results.length > 0 && results[0].score < 0.7) {
    const topResults = results.slice(0, 3);
    const uniqueSuggestions = [...new Set(topResults.map(r => r.item.intent.examples[0]))];
    return {
      text: `🤔 Je ne suis pas sûr de comprendre.\n\nVouliez-vous dire :\n${uniqueSuggestions.map(s => `• ${s}`).join('\n')}`
    };
  }

  //par défaut
  return { 
    text: "Je ne suis pas sûr de comprendre. 🤔\n\nEssayez :\n• 'Factures impayées'\n• 'Cherche client Microsoft'\n• 'Aller au calendrier'\n• 'Aide' pour voir toutes les commandes" 
  };
};