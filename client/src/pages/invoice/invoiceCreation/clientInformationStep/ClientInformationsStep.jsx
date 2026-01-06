import { useEffect, useState } from "react";
import InvoiceButton from "../../component/InvoiceButton";
import InvoiceInput from "../../component/InvoiceInput";
import CreationSectionTitle from "../../CreationSectionTitle";

const STANDARD_PAYMENT_DELAYS = [
  "comptant", "30 jours", "45 jours", "60 jours",
];

const CUSTOM_DELAY_SUFFIXES = [
  { value: "", label: "Sans complément" }, { value: "fin de mois", label: "Fin de mois" },
];

const DEFAULT_SUFFIX = CUSTOM_DELAY_SUFFIXES[0].value;

const TVA_OPTIONS = ["20", "10", "5.5", "2.1"];
const DEFAULT_TVA_OPTION = TVA_OPTIONS[0];

const resolveTvaOption = (fractionalValue) => {
  if (fractionalValue === "" || fractionalValue == null) {
    return DEFAULT_TVA_OPTION;
  }
  const percent = Number(fractionalValue) * 100;
  if (!Number.isFinite(percent)) {
    return DEFAULT_TVA_OPTION;
  }
  const match = TVA_OPTIONS.find((option) => Math.abs(Number(option) - percent) < 0.001);
  return match ?? DEFAULT_TVA_OPTION;
};

const parseCustomDelay = (value) => {
  if (!value) return { days: "", suffix: DEFAULT_SUFFIX };
  const match = value.match(/^(\d+)\s+jours(?:\s+(.*))?$/i);
  if (!match) return { days: "", suffix: value.trim() || DEFAULT_SUFFIX };
  const [, days, suffixRaw] = match;
  return { days, suffix: suffixRaw ? suffixRaw.trim() : DEFAULT_SUFFIX };
};

const ClientInformationsStep = ({
  contactList,
  invoice,
  nextStepFunction,
  handleChange,
  changeTVA,
}) => {
  const [displayTva, setDisplayTva] = useState(() => resolveTvaOption(invoice.TVA_PERCENTAGE));
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (invoice.TVA_PERCENTAGE === "" || invoice.TVA_PERCENTAGE == null) {
      changeTVA(Number(DEFAULT_TVA_OPTION) / 100);
    }
  }, []);

  useEffect(() => {
    setDisplayTva(resolveTvaOption(invoice.TVA_PERCENTAGE));
  }, [invoice.TVA_PERCENTAGE]);

  const selectContact = (e) => {
    const contact = contactList.find((c) => c._id === e.target.value);
    if (!contact) return;

    handleChange("clientId", contact._id);
    handleChange("compagnyName", contact.company || "");
    handleChange("name", contact.name || "");
    handleChange("surname", contact.surname || "");
    handleChange("email", contact.email || "");
    handleChange("phone", contact.phoneNumber || "");
    
    const delay = contact.delaisPaie || "comptant";
    if (STANDARD_PAYMENT_DELAYS.includes(delay)) {
      handleChange("delaisPaie", delay);
      handleChange("customDelaisDays", "");
      handleChange("customDelaisSuffix", DEFAULT_SUFFIX);
    } else {
      handleChange("delaisPaie", "autre");
      const { days, suffix } = parseCustomDelay(delay);
      handleChange("customDelaisDays", days);
      handleChange("customDelaisSuffix", suffix);
    }
  };

  const validateFields = () => {
    const missing = [];
    if (!invoice.client.compagnyName?.trim()) missing.push("Entreprise");
    if (!invoice.client.name?.trim()) missing.push("Nom");
    if (!invoice.client.surname?.trim()) missing.push("Prénom");
    if (!invoice.client.email?.trim()) {
      missing.push("Adresse mail");
    } else {
      const re = /\S+@\S+\.\S+/;
      if (!re.test(invoice.client.email)) missing.push("Adresse mail (format invalide)");
    }
    if (invoice.client.delaisPaie === "autre" && (!invoice.client.customDelaisDays || !/^\d+$/.test(invoice.client.customDelaisDays))) {
      missing.push("Délai de paiement (jours invalides)");
    }
    if (!invoice.client.city?.trim()) missing.push("Ville");
    if (!invoice.client.postalCode?.trim()) missing.push("Code postal");
    if (!invoice.client.address1?.trim()) missing.push("Adresse 1");
    return missing;
  };

  const handleNext = () => {
    const missing = validateFields();
    if (missing.length > 0) {
      setErrors(missing);
      return;
    }
    setErrors([]);
    nextStepFunction();
  };

  return (
    <div className="bg-white w-full h-full py-8 px-9 rounded-md page-appear-animation">
      <CreationSectionTitle
        title={"Informations du contact"}
        subtitle={"Ajoutez toutes les informations du contact pour la facturation"}
      />

      <div className="mt-8">
        <p className="text-[#3F3F3F] opacity-50 font-medium">CONTACT EXISTANT</p>
        <select
          className="text-[#3F3F3F] font-semibold w-full px-3 py-3 rounded-sm mt-2 border-[#E1E1E1] border-[3px]"
          onChange={selectContact}
        >
          <option value="" disabled selected hidden>Choisir un contact</option>
          {contactList.map((contact) => (
            <option key={contact._id} value={contact._id}>
              {contact.company || `${contact.name || ""} ${contact.surname || ""}`.trim() || "-"}
            </option>
          ))}
        </select>

        <div className="flex gap-2 opacity-20 items-center mt-10">
          <span className="h-[1px] w-full bg-[#3F3F3F]"></span>
          <p className="text-[#3F3F3F]">OU</p>
          <span className="h-[1px] w-full bg-[#3F3F3F]"></span>
        </div>

        <p className="text-[#3F3F3F] opacity-50 font-medium mt-10">NOUVEAU CONTACT</p>

        <div className="flex flex-col gap-5 mt-5">
          <div className="flex flex-col md:flex-row w-full gap-3">
            <InvoiceInput title={"Entreprise"} value={invoice.client.compagnyName} mandatory={true} onChange={(e) => handleChange("compagnyName", e.target.value)} />
            <InvoiceInput title={"Nom"} value={invoice.client.name} mandatory={true} onChange={(e) => handleChange("name", e.target.value)} />
            <InvoiceInput title={"Prenom"} value={invoice.client.surname} mandatory={true} onChange={(e) => handleChange("surname", e.target.value)} />
          </div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-[90%]">
            <InvoiceInput title={"Adresse mail"} value={invoice.client.email} inputType="email" mandatory={true} onChange={(e) => handleChange("email", e.target.value)} />
            <InvoiceInput title={"Numéro de téléphone"} value={invoice.client.phone} inputType="tel" mandatory={false} onChange={(e) => handleChange("phone", e.target.value)} />
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <p className="font-medium text-sm text-[#3F3F3F]">Délai de paiement</p>
            <select
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 text-[#3F3F3F]"
              value={invoice.client.delaisPaie || "comptant"}
              onChange={(e) => handleChange("delaisPaie", e.target.value)}
            >
              <option value="comptant">Comptant</option>
              <option value="30 jours">30 jours</option>
              <option value="45 jours">45 jours</option>
              <option value="60 jours">60 jours</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          {invoice.client.delaisPaie === "autre" && (
            <div className="flex flex-col gap-2 md:flex-row md:gap-4 page-appear-animation">
              <div className="flex-1 flex flex-col gap-1">
                <label className="font-medium text-sm text-[#3F3F3F]">Jours</label>
                <input
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 text-[#3F3F3F]"
                  value={invoice.client.customDelaisDays || ""}
                  onChange={(e) => handleChange("customDelaisDays", e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="30"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <label className="font-medium text-sm text-[#3F3F3F]">Complément</label>
                <select
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 text-[#3F3F3F]"
                  value={invoice.client.customDelaisSuffix || DEFAULT_SUFFIX}
                  onChange={(e) => handleChange("customDelaisSuffix", e.target.value)}
                >
                  {CUSTOM_DELAY_SUFFIXES.map((option) => (
                    <option key={option.value || "default"} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-1">
            <p className="text-[#FF6767]">*</p>
            <p className="text-[#3F3F3F] opacity-50">Champs obligatoires</p>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-gray-200">
            <div className="flex gap-1 items-center mb-4">
              <svg className="size-[28px] fill-[#3F3F3F]" viewBox="0 -960 960 960"><path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z" /></svg>
              <p className="text-[#3F3F3F] font-bold text-lg">Informations de facturation</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row gap-2">
                <InvoiceInput title={"Ville"} mandatory={true} value={invoice.client.city} onChange={(e) => handleChange("city", e.target.value)} />
                <InvoiceInput title={"Code postal"} value={invoice.client.postalCode} mandatory={true} onChange={(e) => handleChange("postalCode", e.target.value)} />
              </div>
              <InvoiceInput title={"Adresse 1"} value={invoice.client.address1} mandatory={true} onChange={(e) => handleChange("address1", e.target.value)} />
              <InvoiceInput title={"Adresse 2 - Facultatif"} value={invoice.client.address2} mandatory={false} onChange={(e) => handleChange("address2", e.target.value)} />
            </div>
          </div>

          <div className="flex items-center mt-5 gap-2">
            <label htmlFor="tvaSelect" className="ml-2 text-[#3F3F3F]">TVA</label>
            <select
              id="tvaSelect"
              className="rounded-sm border-[#E1E1E1] border-[3px] h-8 w-[90px] px-3 text-center text-[#3F3F3F] font-bold"
              value={displayTva}
              onChange={(e) => {
                const selected = e.target.value;
                setDisplayTva(selected);
                changeTVA(Number(selected) / 100);
              }}
            >
              {TVA_OPTIONS.map((option) => (
                <option key={option} value={option}>{option} %</option>
              ))}
            </select>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="my-4 p-3 border border-red-200 bg-red-50 text-red-700 rounded">
            <p className="font-semibold">Veuillez corriger les champs suivants :</p>
            <ul className="list-disc ml-5 mt-2">
              {errors.map((err) => (<li key={err}>{err}</li>))}
            </ul>
          </div>
        )}

        <div className="w-full flex justify-end mt-5">
          <InvoiceButton value={"Suivant"} onClickFunction={handleNext} />
        </div>
      </div>
    </div>
  );
};

export default ClientInformationsStep;