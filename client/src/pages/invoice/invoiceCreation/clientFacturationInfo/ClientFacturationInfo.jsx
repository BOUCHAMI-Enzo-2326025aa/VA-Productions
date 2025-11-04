import { useState } from "react";
import CreationSectionTitle from "../../CreationSectionTitle";
import InvoiceInput from "../../component/InvoiceInput";
import InvoiceButton from "../../component/InvoiceButton";

const ClientFacturationInfo = ({
  previousPageFunction,
  nextPageFunction,
  handleChange,
  invoice,
}) => {
  // validation locale
  const [errors, setErrors] = useState([]);

  const validateFields = () => {
    const missing = [];
    if (!invoice.client.city || invoice.client.city.trim() === "") missing.push("Ville");
    if (!invoice.client.postalCode || invoice.client.postalCode.trim() === "")
      missing.push("Code postal");
    if (!invoice.client.address1 || invoice.client.address1.trim() === "")
      missing.push("Adresse 1");
    return missing;
  };

  const handleNext = () => {
    const missing = validateFields();
    if (missing.length > 0) {
      setErrors(missing);
      return;
    }
    setErrors([]);
    nextPageFunction();
  };

  return (
    <div className="bg-white w-full h-full py-8 px-9 rounded-md page-appear-animation">
      <CreationSectionTitle
        title={"Informations du contact"}
        subtitle={
          "Ajoutez toutes les informations du contact pour la facturation"
        }
      />

      {/* Titre client */}
      <div className="flex gap-1 mt-16 items-center">
        <svg className="size-[32px] fill-[#3F3F3F]" viewBox="0 -960 960 960">
          <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z" />
        </svg>
        <p className="text-[#3F3F3F] font-bold text-lg">Client</p>
      </div>

      {/* Formulaire pour les coordonnées de facturation*/}

      <div className="flex flex-col gap-3">
        <div className="flex gap-2 mt-5 mb-7">
          <InvoiceInput
            title={"Ville"}
            mandatory={true}
            value={invoice.client.city}
            onChange={(e) => handleChange("city", e.target.value)}
          />
          <InvoiceInput
            title={"Code postal"}
            value={invoice.client.postalCode}
            mandatory={true}
            onChange={(e) => handleChange("postalCode", e.target.value)}
          />
        </div>

        <InvoiceInput
          title={"Adresse 1"}
          value={invoice.client.address1}
          mandatory={true}
          onChange={(e) => handleChange("address1", e.target.value)}
        />
        <InvoiceInput
          title={"Adresse 2 - Facultatif"}
          value={invoice.client.address2}
          mandatory={false}
          onChange={(e) => handleChange("address2", e.target.value)}
        />
      </div>

      <div className="flex gap-1 mt-3">
        <p className="text-[#FF6767]">*</p>
        <p className="text-[#3F3F3F] opacity-50">Champs obligatoires</p>
      </div>

      {/* Bouton de validation */}
      {/* erreurs de validation */}
      {errors.length > 0 && (
        <div className="mb-4 p-3 border border-red-200 bg-red-50 text-red-700 rounded">
          <p className="font-semibold">Veuillez corriger les champs suivants :</p>
          <ul className="list-disc ml-5 mt-2">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2 mt-[92px] w-full justify-between">
        <InvoiceButton
          primary={false}
          value={"Précedent"}
          onClickFunction={previousPageFunction}
        />
        <InvoiceButton value={"Suivant"} onClickFunction={handleNext} />
      </div>
    </div>
  );
};

export default ClientFacturationInfo;
