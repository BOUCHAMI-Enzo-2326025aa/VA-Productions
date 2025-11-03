import { useEffect, useState } from "react";
import InvoiceButton from "../../component/InvoiceButton";
import InvoiceInput from "../../component/InvoiceInput";
import CreationSectionTitle from "../../CreationSectionTitle";

const ClientInformationsStep = ({
  contactList,
  invoice,
  nextStepFunction,
  handleChange,
  changeTVA,
}) => {
  // affichage local (en %) pour rendre le champ vraiment modifiable
  const [displayTva, setDisplayTva] = useState(() =>
    invoice.TVA_PERCENTAGE === "" || invoice.TVA_PERCENTAGE == null
      ? 20
      : Number(invoice.TVA_PERCENTAGE) * 100
  );

  // initialise la TVA stockée côté parent à 20% si elle est absente
  useEffect(() => {
    if (invoice.TVA_PERCENTAGE === "" || invoice.TVA_PERCENTAGE == null) {
      changeTVA(0.2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // si la valeur côté parent change, on met à jour l'affichage
  useEffect(() => {
    const pct =
      invoice.TVA_PERCENTAGE === "" || invoice.TVA_PERCENTAGE == null
        ? 20
        : Number(invoice.TVA_PERCENTAGE) * 100;
    setDisplayTva(pct);
  }, [invoice.TVA_PERCENTAGE]);
  const selectContact = (e) => {
    const contact = contactList.find(
      (contact) => contact._id === e.target.value
    );
    handleChange("clientId", contact._id);
    handleChange("compagnyName", contact.company || "");
    handleChange("name", contact.name || "");
    handleChange("surname", contact.surname || "");
    handleChange("email", contact.email || "");
    handleChange("phone", contact.phoneNumber || "");
  };

  return (
    <div className="bg-white w-full h-full py-8 px-9 rounded-md page-appear-animation">
      <CreationSectionTitle
        title={"Informations du contact"}
        subtitle={
          "Ajoutez toutes les informations du contact pour la facturation"
        }
      />

      <div className="mt-8">
        <p className="text-[#3F3F3F] opacity-50 font-medium">
          CONTACT EXISTANT
        </p>
        <select
          className="text-[#3F3F3F] font-semibold w-full px-3 py-3 rounded-sm mt-2 border-[#E1E1E1] border-[3px]"
          onChange={(e) => selectContact(e)}
        >
          <option value="" disabled selected hidden>
            Choisir un contact
          </option>
          {contactList.map((contact) => (
            <option key={contact._id} value={contact._id}>
              {contact.name} {contact.surname}
            </option>
          ))}
        </select>

        <div className="flex gap-2 opacity-20 items-center mt-10">
          <span className="h-[1px] w-full bg-[#3F3F3F]"></span>
          <p className="text-[#3F3F3F]">OU</p>
          <span className="h-[1px] w-full bg-[#3F3F3F]"></span>
        </div>

        <p className="text-[#3F3F3F] opacity-50 font-medium mt-10">
          NOUVEAU CONTACT
        </p>

        <div className="flex flex-col gap-5 mt-5">
          <div className="flex w-full gap-3">
            <InvoiceInput
              title={"Entreprise"}
              value={invoice.client.compagnyName}
              mandatory={true}
              onChange={(e) => handleChange("compagnyName", e.target.value)}
            />
            <InvoiceInput
              title={"Nom"}
              value={invoice.client.name}
              mandatory={true}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            <InvoiceInput
              title={"Prenom"}
              value={invoice.client.surname}
              mandatory={true}
              onChange={(e) => handleChange("surname", e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-[90%]">
            <InvoiceInput
              title={"Adresse mail"}
              value={invoice.client.email}
              inputType="email"
              mandatory={true}
              onChange={(e) => handleChange("email", e.target.value)}
            />
            <InvoiceInput
              title={"Numéro de téléphone"}
              value={invoice.client.phone}
              inputType="tel"
              mandatory={false}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>

          <div className="flex gap-1">
            <p className="text-[#FF6767]">*</p>
            <p className="text-[#3F3F3F] opacity-50">Champs obligatoires</p>
          </div>

          <div className="flex items-center mt-5 gap-2">
            <label htmlFor="tvaCheckbox" className="ml-2 text-[#3F3F3F]">
              TVA
            </label>
            <div className="flex items-center">
              <input
                type="number"
                min="0"
                className="rounded-sm border-[#E1E1E1] border-[3px] h-8 w-[60px] text-[#3F3F3F] text-center font-bold"
                // affichage local modifiable en pourcentage 
                value={displayTva}
                onChange={(e) => {
                  const raw = e.target.value;
                  setDisplayTva(raw);
                  // stocke la TVA en fraction (ex: 20 -> 0.2)
                  changeTVA(Number((raw / 100).toFixed(4)));
                }}
              />
              <span className="ml-2 text-sm text-[#3F3F3F]">%</span>
            </div>
          </div>
        </div>

        <div className="w-full justify-end flex mt-5">
          <InvoiceButton
            value={"Suivant"}
            className={"ml-auto"}
            onClickFunction={nextStepFunction}
          />
        </div>
      </div>
    </div>
  );
};

export default ClientInformationsStep;
