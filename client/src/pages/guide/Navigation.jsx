import React from "react";

const Navigation = () => {
  return (
    <div className="hidden lg:flex flex-col w-fit gap-2 fixed right-[10%] top-48">
      <a
        href="#stats"
        className="cursor-pointer font-bold hover:translate-x-4 transition-all w-fit"
      >
        I - Le Dashboard
      </a>
      <p className="cursor-pointer font-bold hover:translate-x-4 transition-all w-fit">
        II - Gestion des contacts
      </p>
      <p className="cursor-pointer font-bold hover:translate-x-4 transition-all w-fit">
        III - Gestion des rendez vous
      </p>
      <p className="cursor-pointer font-bold hover:translate-x-4 transition-all w-fit">
        IV - Gestion des factures
      </p>
      <p className="cursor-pointer font-bold hover:translate-x-4 transition-all w-fit">
        V - Les bons de commande
      </p>
      <p className="cursor-pointer font-bold hover:translate-x-4 transition-all w-fit">
        VI - Gestions des utilisateurs
      </p>
      <p className="cursor-pointer font-bold hover:translate-x-4 transition-all w-fit">
        VII - Statistiques
      </p>
    </div>
  );
};

export default Navigation;