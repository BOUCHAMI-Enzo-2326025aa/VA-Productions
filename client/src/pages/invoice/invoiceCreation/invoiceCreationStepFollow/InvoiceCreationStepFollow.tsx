import React from "react";
import CreationSectionTitle from "../../CreationSectionTitle";
import InvoiceStep from "./InvoiceStep";

const InvoiceCreationStepFollow = ({ step }: { step: number }) => {
    return (
    <div className="bg-white w-full py-8 px-9 rounded-md max-h-fit">
      <CreationSectionTitle
        title={"Création d’une commande"}
        subtitle={"Etapes de création d’une nouvelle commande"}
      />
      <div className="mt-10">
        <InvoiceStep
          title={"Informations du contact"}
          subtitle={
            "Ajoutez toutes les informations du contact pour la facturation"
          }
          isLastStep={false}
          isComplete={step > 1}
        />
        <InvoiceStep
          title={"Support à facturer"}
          subtitle={"Indiquez le support sur lequel se portera la facturation"}
          isComplete={step > 2}
          isLastStep={false}
        />
        <InvoiceStep
          title={"Frais de la facture"}
          subtitle={"Ajoutez les coûts et frais de sous-traitance"}
          isComplete={step > 3}
          isLastStep={false}
        />
        <InvoiceStep
          title={"Information de facturation"}
          subtitle={
            "Saisissez toutes les informations relatives au client et à la facture "
          }
          isComplete={step > 4}
          isLastStep={false}
        />
        <InvoiceStep
          title={"Confirmation de la facture"}
          subtitle={""}
          isComplete={step > 5}
          isLastStep={true}
        />
      </div>
    </div>
  );
};

export default InvoiceCreationStepFollow;
