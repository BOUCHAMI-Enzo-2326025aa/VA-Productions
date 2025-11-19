import React from "react";

const Navigation = () => {
  return (
    <div className="hidden lg:flex flex-col w-fit gap-2 fixed right-[10%] top-48">
      <a
        href="#dashboard"
        className="cursor-pointer font-bold hover:translate-x-4 transition-all w-fit"
      >
        I - Le Dashboard
      </a>
      <a
        href="#gestion-contacts"
        className="cursor-pointer font-bold hover:translate-x-4 transition-all w-fit"
      >
        II - Gestion des contacts
      </a>
      <a
        href="#gestion-rendezvous"
        className="cursor-pointer font-bold hover:translate-x-4 transition-all w-fit"
      >
        III - Gestion des rendez-vous
      </a>
      <a
        href="#gestion-factures"
        className="cursor-pointer font-bold hover:translate-x-4 transition-all w-fit"
      >
        IV - Gestion des factures
      </a>
      <a
        href="#gestion-commandes"
        className="cursor-pointer font-bold hover:translate-x-4 transition-all w-fit"
      >
        V - Les bons de commande
      </a>
      <a
        href="#gestion-utilisateurs"
        className="cursor-pointer font-bold hover:translate-x-4 transition-all w-fit"
      >
        VI - Gestion des utilisateurs
      </a>
      <a
        href="#stats"
        className="cursor-pointer font-bold hover:translate-x-4 transition-all w-fit"
      >
        VII - Statistiques
      </a>
    </div>
  );
};

export default Navigation;