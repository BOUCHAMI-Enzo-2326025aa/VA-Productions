import { useState } from "react";
import Input from "../../../components/Input.jsx";
import Button from "../../../components/ui/Button";

const EditContact = ({ contact, closeModal, saveContact }) => {
  const [contactCopy, setContact] = useState({
    ...contact,
    delaisPaie: contact.delaisPaie || "comptant",
  });

  const handleChange = (field, value) => {
    setContact((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div
      className="absolute bg-black bg-opacity-50 w-full h-full z-[99] flex appearAnimation"
      onClick={closeModal}
    >
      <div
        className="bg-white px-10 py-7 min-w-[60%] w-[600px] rounded flex flex-col gap-2 h-fit"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="font-bold text-lg">Modifier les informations</p>
          <p className="text-sm opacity-70">
            Modifier toutes les informations relatives au contact
          </p>
        </div>
        <Input
          title={"Entreprise"}
          style={"mt-4"}
          value={contactCopy.company}
          onChange={(e) => handleChange("company", e.target.value)}
        />
        <div className="flex gap-2">
          <Input
            title={"Nom"}
            style={"w-full"}
            value={contactCopy.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
          <Input
            title={"Prenom"}
            style={"w-full"}
            value={contactCopy.surname}
            onChange={(e) => handleChange("surname", e.target.value)}
          />
        </div>
        <Input
          title={"Numéro de téléphone"}
          value={contactCopy.phoneNumber}
          onChange={(e) => handleChange("phoneNumber", e.target.value)}
        />
        <Input
          title={"Adresse Mail"}
          value={contactCopy.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />
        <Input
          title={"Numéro de SIRET"}
          value={contactCopy.siret || ""}
          onChange={(e) => handleChange("siret", e.target.value)}
        />
        <Input
          title={"Numéro de TVA"}
          value={contactCopy.numTVA || ""}
          onChange={(e) => handleChange("numTVA", e.target.value)}
        />
        <div className="flex flex-col gap-2">
          <p className="font-medium text-sm text-[#3F3F3F]">Délai de paiement</p>
          <select
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
            value={contactCopy.delaisPaie || "comptant"}
            onChange={(e) => handleChange("delaisPaie", e.target.value)}
          >
            <option value="comptant">Comptant</option>
            <option value="30 jours">30 jours</option>
            <option value="45 jours">45 jours</option>
            <option value="60 jours">60 jours</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-medium text-sm text-[#3F3F3F]">Statut</p>
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="PROSPECT"
                checked={contactCopy.status === "PROSPECT"}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Prospect</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="CLIENT"
                checked={contactCopy.status === "CLIENT"}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-4 h-4 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm">Client</span>
            </label>
          </div>
        </div>
        <Button
          value={"Enregistrer"}
          className={"mt-6"}
          onClickFunction={() => saveContact(contactCopy)}
        />
      </div>
    </div>
  );
};

export default EditContact;
