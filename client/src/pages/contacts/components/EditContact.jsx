import { useState } from "react";
import Input from "../../../components/Input.jsx";
import Button from "../../../components/ui/Button";

const STANDARD_PAYMENT_DELAYS = [
  "comptant",
  "30 jours",
  "45 jours",
  "60 jours",
];

const CUSTOM_DELAY_SUFFIXES = [
  { value: "", label: "Sans complément" },
  { value: "fin de mois", label: "Fin de mois" },
];

const DEFAULT_SUFFIX = CUSTOM_DELAY_SUFFIXES[0].value;

const parseCustomDelay = (value) => {
  if (!value) {
    return { days: "", suffix: DEFAULT_SUFFIX };
  }

  const match = value.match(/^(\d+)\s+jours(?:\s+(.*))?$/i);
  if (!match) {
    return {
      days: "",
      suffix: value.trim() || DEFAULT_SUFFIX,
    };
  }

  const [, days, suffixRaw] = match;
  return {
    days,
    suffix: suffixRaw ? suffixRaw.trim() : DEFAULT_SUFFIX,
  };
};

const EditContact = ({ contact, closeModal, saveContact }) => {
  const initialDelay = contact.delaisPaie || "comptant";
  const hasStandardDelay = STANDARD_PAYMENT_DELAYS.includes(initialDelay);
  const customInitial = hasStandardDelay
    ? { days: "", suffix: DEFAULT_SUFFIX }
    : parseCustomDelay(initialDelay);

  const [contactCopy, setContact] = useState({
    ...contact,
    delaisPaie: hasStandardDelay ? initialDelay : "autre",
    customDelaisDays: customInitial.days,
    customDelaisSuffix: customInitial.suffix,
  });

  const [errors, setErrors] = useState({});

  const suffixOptions = CUSTOM_DELAY_SUFFIXES.some(
    (option) => option.value === contactCopy.customDelaisSuffix
  )
    ? CUSTOM_DELAY_SUFFIXES
    : [
        ...CUSTOM_DELAY_SUFFIXES,
        ...(contactCopy.customDelaisSuffix
          ? [
              {
                value: contactCopy.customDelaisSuffix,
                label: contactCopy.customDelaisSuffix,
              },
            ]
          : []),
      ];

  const handleChange = (field, value) => {
    if (field === "customDelaisDays") {
      const numericValue = value.replace(/[^0-9]/g, "");
      setContact((prev) => ({ ...prev, customDelaisDays: numericValue }));

      if (!numericValue) {
        setErrors((prev) => ({
          ...prev,
          customDelaisDays: "Veuillez saisir un nombre de jours.",
        }));
      } else {
        setErrors((prev) => ({ ...prev, customDelaisDays: null }));
      }
      return;
    }

    if (field === "customDelaisSuffix") {
      setContact((prev) => ({ ...prev, customDelaisSuffix: value }));
      setErrors((prev) => ({ ...prev, customDelaisSuffix: null }));
      return;
    }

    if (field === "delaisPaie") {
      setContact((prev) => ({
        ...prev,
        delaisPaie: value,
        ...(value === "autre"
          ? {}
          : {
              customDelaisDays: "",
              customDelaisSuffix: DEFAULT_SUFFIX,
            }),
      }));

      if (!value) {
        setErrors((prev) => ({
          ...prev,
          delaisPaie: "Veuillez sélectionner un délai de paiement.",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          delaisPaie: null,
          ...(value !== "autre"
            ? { customDelaisDays: null, customDelaisSuffix: null }
            : {}),
        }));
      }
      return;
    }

    setContact((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    const updatedErrors = { ...errors };
    let computedDelaisPaie = contactCopy.delaisPaie;

    if (contactCopy.delaisPaie === "autre") {
      const numericValue = (contactCopy.customDelaisDays || "").trim();

      if (!numericValue) {
        updatedErrors.customDelaisDays = "Veuillez saisir un nombre de jours.";
      } else if (!/^[0-9]+$/.test(numericValue)) {
        updatedErrors.customDelaisDays =
          "Le nombre de jours doit contenir uniquement des chiffres.";
      } else {
        updatedErrors.customDelaisDays = null;
        const suffixValue = contactCopy.customDelaisSuffix || "";
        computedDelaisPaie = `${numericValue} jours${
          suffixValue ? ` ${suffixValue}` : ""
        }`.trim();
      }
    } else {
      updatedErrors.customDelaisDays = null;
      updatedErrors.customDelaisSuffix = null;
    }

    setErrors(updatedErrors);

    const hasBlockingErrors = Object.values(updatedErrors).some((message) =>
      Boolean(message)
    );

    if (hasBlockingErrors) {
      return;
    }

    const { customDelaisDays, customDelaisSuffix, ...contactToPersist } = {
      ...contactCopy,
      delaisPaie: computedDelaisPaie,
    };

    saveContact(contactToPersist);
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
          <p className="font-medium text-sm text-[#3F3F3F]">Statut</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="PROSPECT"
                checked={contactCopy.status === "PROSPECT"}
                onChange={(e) => handleChange("status", e.target.value)}
                className="cursor-pointer"
              />
              <span>Prospect</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="CLIENT"
                checked={contactCopy.status === "CLIENT"}
                onChange={(e) => handleChange("status", e.target.value)}
                className="cursor-pointer"
              />
              <span>Client</span>
            </label>
          </div>
        </div>
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
            <option value="autre">Autre</option>
          </select>
        </div>
        {contactCopy.delaisPaie === "autre" && (
          <div className="flex flex-col gap-2 md:flex-row md:gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <label className="font-medium text-sm text-[#3F3F3F]">Jours</label>
              {errors.customDelaisDays && (
                <p className="text-red-500 text-xs">{errors.customDelaisDays}</p>
              )}
              <input
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                value={contactCopy.customDelaisDays || ""}
                onChange={(e) => handleChange("customDelaisDays", e.target.value)}
                inputMode="numeric"
                autoComplete="off"
                placeholder="30"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="font-medium text-sm text-[#3F3F3F]">Complément</label>
              <select
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400"
                value={contactCopy.customDelaisSuffix || DEFAULT_SUFFIX}
                onChange={(e) => handleChange("customDelaisSuffix", e.target.value)}
              >
                {suffixOptions.map((option) => (
                  <option key={option.value || "default"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        <Button
          value={"Enregistrer"}
          className={"mt-6"}
          onClickFunction={handleSave}
        />
      </div>
    </div>
  );
};

export default EditContact;
