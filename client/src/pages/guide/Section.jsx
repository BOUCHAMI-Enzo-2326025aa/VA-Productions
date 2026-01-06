import React from "react";

const Section = ({ children, className, name }) => {
  return (
    // On remplace l'attribut "name" par "id" pour que les ancres fonctionnent
    <div id={name} className={className + " flex flex-col gap-2"}>
      {children}
    </div>
  );
};

export default Section;