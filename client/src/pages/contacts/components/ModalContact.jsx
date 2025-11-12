import axios from "axios";
import React, { useEffect, useState } from "react";
import SnackBar from "./SnackBar";
import CloseIcon from "../../../assets/CloseIcon.svg";
import "../contact.css";

const ModalContact = ({ handleCloseModal, fetchContact, isModalOpen }) => {
  const [formData, setFormData] = useState({
    company: "",
    name: "",
    surname: "",
    email: "",
    phoneNumber: "",
    siret: "",
    numTVA: "",
    delaisPaie: "comptant",
    comments: "",
    status: "",
  });
  const [errors, setErrors] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const nameRegex = /^[A-Za-z'-]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{2}( ?:?[0-9]{2}){4}$/;
  const siretRegex = /^[0-9]{14}$/;
  const requiredFieldMessages = {
    company: "Le nom de l'entreprise est requis.",
    name: "Le nom du contact est requis.",
    surname: "Le prénom du contact est requis.",
    siret: "Le numéro de SIRET est requis.",
    numTVA: "Le numéro de TVA est requis.",
  };
  const [snackbar, setSnackbar] = useState({
    open: false,
    type: "",
    message: "",
  });

  useEffect(() => {
    if (!isModalOpen) {
      setFormData({
        company: "",
        name: "",
        surname: "",
        email: "",
        phoneNumber: "",
        siret: "",
        numTVA: "",
        delaisPaie: "comptant",
        comments: "",
        status: "",
      });
      setErrors({});
    }
  }, [isModalOpen]);

  const showSnackbar = (type, message) => {
    setSnackbar({ open: true, type, message });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }));

    switch (name) {
      case "company":
        if (!value.trim()) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: requiredFieldMessages.company,
          }));
        } else {
          setErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
        }
        break;
      case "name":
      case "surname":
        if (!value.trim()) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: requiredFieldMessages[name],
          }));
          break;
        }
        if (value && !nameRegex.test(value)) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            [name]:
              "Seules les lettres, les tirets et les apostrophes sont autorisés.",
          }));
        } else {
          setErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
        }
        break;
      case "email":
        if (value && !emailRegex.test(value)) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: "L'adresse email est incorrecte.",
          }));
        } else {
          setErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
        }
        break;
      case "phoneNumber":
        if (value && !phoneRegex.test(value)) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: "Le numéro de téléphone est incorrecte.",
          }));
        } else {
          setErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
        }
        break;
      case "siret":
        if (!value.trim()) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: requiredFieldMessages.siret,
          }));
        } else if (value && !siretRegex.test(value)) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: "Le numéro de SIRET doit contenir 14 chiffres.",
          }));
        } else {
          setErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
        }
        break;
      case "numTVA":
        if (!value.trim()) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: requiredFieldMessages.numTVA,
          }));
        } else {
          setErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
        }
        break;
      case "delaisPaie":
        if (!value) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: "Veuillez sélectionner un délai de paiement.",
          }));
        } else {
          setErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
        }
        break;
      case "status":
        if (!value) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: "Veuillez cocher la case appropriée",
          }));
        } else {
          setErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
        }
        break;
    }
  };

  const handleSubmit = async () => {
    const updatedErrors = { ...errors };

    Object.entries(requiredFieldMessages).forEach(([field, message]) => {
      if (!formData[field] || formData[field].trim() === "") {
        updatedErrors[field] = message;
      } else if (updatedErrors[field] && updatedErrors[field] === message) {
        updatedErrors[field] = null;
      }
    });

    if (!formData.status) {
      updatedErrors.status = "Veuillez sélectionner une option (Prospect ou Client).";
    } else if (updatedErrors.status && updatedErrors.status.startsWith("Veuillez sélectionner")) {
      updatedErrors.status = null;
    }

    if (!formData.delaisPaie) {
      updatedErrors.delaisPaie = "Veuillez sélectionner un délai de paiement.";
    } else if (updatedErrors.delaisPaie && updatedErrors.delaisPaie.startsWith("Veuillez sélectionner")) {
      updatedErrors.delaisPaie = null;
    }

    const hasBlockingErrors = Object.values(updatedErrors).some((message) => Boolean(message));
    setErrors(updatedErrors);

    if (hasBlockingErrors) {
      showSnackbar(
        "error",
        "Impossible de créer le contact : veuillez corriger les champs indiqués en rouge."
      );
      return;
    }
    try {
      setIsCreating(true);
      await axios.post(import.meta.env.VITE_API_HOST + "/api/contact/create", {
        company: formData.company,
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        siret: formData.siret,
        numTVA: formData.numTVA,
        delaisPaie: formData.delaisPaie,
        comments: formData.comments,
        lastCall: Date.now(),
        status: formData.status,
      });
      showSnackbar("success", "Le nouveau contact a été créé avec succès !");
      fetchContact();
      handleCloseModal();
    } catch (error) {
      console.error("Erreur lors de la création du contact : ", error);
      showSnackbar(
        "error",
        "Une erreur est survenue lors de la création du contact."
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      {snackbar.open && (
        <SnackBar
          type={snackbar.type}
          message={snackbar.message}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
      <div
        className={
          "fixed inset-0 flex items-center justify-center z-50 transform-all transition-all " +
          (!isModalOpen && "translate-y-full")
        }
      >
        <div className="bg-[#F6F6F6] w-[300px] p-4 rounded-lg shadow-lg">
          <form
            className="flex flex-col gap-[20px]"
            onSubmit={(e) => {
              e.preventDefault();
              fetchContact();
            }}
          >
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold text-[#3F3F3F]">
                Nouveau contact
              </h2>
              <img src={CloseIcon} onClick={handleCloseModal} />
            </div>
            <div className="flex flex-col gap-[10px]">
              <div className="flex flex-col gap-[5px]">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Entreprise
                </label>
                {errors.company && (
                  <p className="text-red-500 text-sm">{errors.company}</p>
                )}
                <div className="border-[1px] border-[#3F3F3F] border-opacity-15 rounded-lg p-[5px] space-x-[5px] items-center flex">
                  <input
                    className="bg-transparent focus:border-transparent focus:ring-0 border-transparent focus:outline-none font-inter text-[#3F3F3F] placeholder-opacity-50 w-screen "
                    placeholder="Microsoft"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-[5px]">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nom
                </label>
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name}</p>
                )}
                <div className="border-[1px] border-[#3F3F3F] border-opacity-15 rounded-lg p-[5px] space-x-[5px] items-center flex">
                  <input
                    className="bg-transparent focus:border-transparent focus:ring-0 border-transparent focus:outline-none font-inter text-[#3F3F3F] placeholder-opacity-50 w-screen "
                    placeholder="Doe"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-[5px]">
                <label
                  htmlFor="surname"
                  className="block text-sm font-medium text-gray-700"
                >
                  Prénom
                </label>
                {errors.surname && (
                  <p className="text-red-500 text-sm">{errors.surname}</p>
                )}
                <div className="border-[1px] border-[#3F3F3F] border-opacity-15 rounded-lg p-[5px] space-x-[5px] items-center flex">
                  <input
                    className="bg-transparent focus:border-transparent focus:ring-0 border-transparent focus:outline-none font-inter text-[#3F3F3F] placeholder-opacity-50 w-screen "
                    placeholder="John"
                    name="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-[5px]">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Adresse email
                </label>
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
                <div className="border-[1px] border-[#3F3F3F] border-opacity-15 rounded-lg p-[5px] space-x-[5px] items-center flex">
                  <input
                    className="bg-transparent focus:border-transparent focus:ring-0 border-transparent focus:outline-none font-inter text-[#3F3F3F] placeholder-opacity-50 w-screen "
                    placeholder="johndoe@gmail.com"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-[5px]">
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700"
                >
                  Numéro de téléphone
                </label>
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm">{errors.phoneNumber}</p>
                )}
                <div className="border-[1px] border-[#3F3F3F] border-opacity-15 rounded-lg p-[5px] space-x-[5px] items-center flex">
                  <input
                    className="bg-transparent focus:border-transparent focus:ring-0 border-transparent focus:outline-none font-inter text-[#3F3F3F] placeholder-opacity-50 w-screen "
                    placeholder="07 85 42 12 34"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-[5px]">
                <label
                  htmlFor="siret"
                  className="block text-sm font-medium text-gray-700"
                >
                  Numéro de SIRET
                </label>
                {errors.siret && (
                  <p className="text-red-500 text-sm">{errors.siret}</p>
                )}
                <div className="border-[1px] border-[#3F3F3F] border-opacity-15 rounded-lg p-[5px] space-x-[5px] items-center flex">
                  <input
                    className="bg-transparent focus:border-transparent focus:ring-0 border-transparent focus:outline-none font-inter text-[#3F3F3F] placeholder-opacity-50 w-screen "
                    placeholder="12345678901234"
                    name="siret"
                    value={formData.siret}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-[5px]">
                <label
                  htmlFor="numTVA"
                  className="block text-sm font-medium text-gray-700"
                >
                  Numéro de TVA
                </label>
                {errors.numTVA && (
                  <p className="text-red-500 text-sm">{errors.numTVA}</p>
                )}
                <div className="border-[1px] border-[#3F3F3F] border-opacity-15 rounded-lg p-[5px] space-x-[5px] items-center flex">
                  <input
                    className="bg-transparent focus:border-transparent focus:ring-0 border-transparent focus:outline-none font-inter text-[#3F3F3F] placeholder-opacity-50 w-screen "
                    placeholder="FR00123456789"
                    name="numTVA"
                    value={formData.numTVA}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-[5px]">
                <label
                  htmlFor="delaisPaie"
                  className="block text-sm font-medium text-gray-700"
                >
                  Délai de paiement
                </label>
                {errors.delaisPaie && (
                  <p className="text-red-500 text-sm">{errors.delaisPaie}</p>
                )}
                <div className="border-[1px] border-[#3F3F3F] border-opacity-15 rounded-lg p-[5px] items-center flex">
                  <select
                    className="bg-transparent focus:border-transparent focus:ring-0 border-transparent focus:outline-none font-inter text-[#3F3F3F] w-full"
                    name="delaisPaie"
                    value={formData.delaisPaie}
                    onChange={handleChange}
                  >
                    <option value="comptant">Comptant</option>
                    <option value="30 jours">30 jours</option>
                    <option value="45 jours">45 jours</option>
                    <option value="60 jours">60 jours</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-[5px]">
                <label
                  htmlFor="comments"
                  className="block text-sm font-medium text-gray-700"
                >
                  Note(s)
                </label>
                <div className="border-[1px] border-[#3F3F3F] border-opacity-15 rounded-lg p-[5px] space-x-[5px] items-center flex">
                  <input
                    className="bg-transparent focus:border-transparent focus:ring-0 border-transparent focus:outline-none font-inter text-[#3F3F3F] placeholder-opacity-50 w-screen "
                    placeholder="Un homme génial"
                    name="comments"
                    type="text"
                    value={formData.comments}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                {errors.status && (
                  <p className="text-red-500 text-sm">{errors.status}</p>
                )}
                <div
                  className="flex flex-row gap-[5px] text-gray-700"
                  onChange={handleChange}
                >
                  <input type="radio" value="PROSPECT" name="status" />
                  Prospect
                  <input type="radio" value="CLIENT" name="status" /> Client
                </div>
              </div>
            </div>

            <button
              className={
                "text-white px-4 py-2 rounded-md btn-new-contact " +
                (isCreating && "opacity-70")
              }
              onClick={handleSubmit}
              disabled={isCreating ? true : false}
            >
              {isCreating ? (
                <div
                  role="status"
                  className="inline-block h-3 w-3 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
                ></div>
              ) : (
                <p>Créer</p>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ModalContact;
