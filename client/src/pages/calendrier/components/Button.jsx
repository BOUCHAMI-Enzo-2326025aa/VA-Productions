import { useState } from "react";
import Notification from "./Notification";
import "../Calendrier.css";
import plus_icon from "../../../assets/plus-icon.svg";
import EditableText from "../../../components/EditableText";

const readStoredValue = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw;
  } catch {
    return fallback;
  }
};

const Button = ({ onCreate, isEditing = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    startTime: "",
    endTime: "",
    company: "",
    location: "",
    description: "",
  });
  const [notification, setNotification] = useState(null);
  const [newEventLabel, setNewEventLabel] = useState(() =>
    readStoredValue("calendar:new-event", "Nouveau rendez-vous")
  );
  const [createTitle, setCreateTitle] = useState(() =>
    readStoredValue("calendar:create:title", "Créer un nouvel événement")
  );
  const [startLabel, setStartLabel] = useState(() =>
    readStoredValue("calendar:create:start", "Heure de début")
  );
  const [endLabel, setEndLabel] = useState(() =>
    readStoredValue("calendar:create:end", "Heure de fin")
  );
  const [clientLabel, setClientLabel] = useState(() =>
    readStoredValue("calendar:create:client", "Client")
  );
  const [locationLabel, setLocationLabel] = useState(() =>
    readStoredValue("calendar:create:location", "Lieu")
  );
  const [descriptionLabel, setDescriptionLabel] = useState(() =>
    readStoredValue("calendar:create:description", "Description")
  );
  const [saveLabel, setSaveLabel] = useState(() =>
    readStoredValue("calendar:create:save", "Enregistrer")
  );
  const [savingLabel, setSavingLabel] = useState(() =>
    readStoredValue("calendar:create:saving", "Enregistrement...")
  );
  const [cancelLabel, setCancelLabel] = useState(() =>
    readStoredValue("calendar:create:cancel", "Annuler")
  );

  // Fonction pour ouvrir le formulaire
  const handleOpen = () => {
    if (isEditing) return;
    setIsOpen(true);
  };

  // Fonction pour fermer le formulaire et réinitialiser les champs
  const handleClose = () => {
    setIsOpen(false);
    setFormData({
      startTime: "",
      endTime: "",
      company: "",
      location: "",
      description: "",
    });
  };

  // Gestion des changements dans les champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Validation des données du formulaire
  const validateFormData = () => {
    if (!formData.startTime || !formData.endTime || !formData.company) {
      setNotification({
        message: "Tous les champs obligatoires doivent être remplis.",
        type: "error",
      });
      return false;
    }

    return true;
  };

  // Fonction pour enregistrer les données
  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validation avant l'envoi
    if (!validateFormData()) {
      return;
    }
    
    setIsSaving(true);

    const newEvent = {
      startTime: formData.startTime,
      endTime: formData.endTime,
      company: formData.company,
      location: formData.location,
      description: formData.description,
    };

    console.log("🚀 Envoi événement:", newEvent);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_HOST}/api/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newEvent),
        }
      );

      console.log("📡 Réponse HTTP:", response.status, response.statusText);

      if (response.ok) {
        const savedEvent = await response.json();
        console.log("✅ Événement sauvegardé:", savedEvent);
        onCreate(savedEvent);
        setNotification({
          message: "Événement enregistré avec succès !",
          type: "success",
        });
        handleClose();
      } else {
        const errorData = await response.json();
        console.error("❌ Erreur serveur:", response.status, errorData);
        setNotification({
          message: `Erreur ${response.status}: ${errorData.message || 'Impossible de sauvegarder'}`,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Erreur requête:", error);
      setNotification({
        message: "Une erreur s'est produite lors de la requête.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {isEditing ? (
        <div className="border-2 border-dashed border-[#3F3F3F] rounded-sm">
          <EditableText
            storageKey="calendar:new-event"
            defaultValue={newEventLabel}
            isEditing={isEditing}
            inputBaseClassName="bg-[#3F3F3F] text-white font-medium gap-2 px-6 py-3 rounded-sm font-inter flex items-center w-full"
            inputClassName="text-white font-medium text-center"
            onValueChange={setNewEventLabel}
          />
        </div>
      ) : (
        <button
          className="bg-[#3F3F3F] text-white font-medium gap-2 px-6 py-3 rounded-sm font-inter flex items-center"
          onClick={handleOpen}
        >
          <img src={plus_icon} alt="plus" />
          {newEventLabel}
        </button>
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div
        className={`absolute right-0 top-0 h-screen max-h-screen w-[100%] lg:w-[40%] xl:w-[33%] bg-[#F6F6F6] z-30 transition-all border border-[#818181] border-opacity-15 p-10 overflow-y-scroll transform ${
          isOpen ? "translate-x-0" : "translate-x-[100%]"
        }`}
      >
        <EditableText
          storageKey="calendar:create:title"
          defaultValue={createTitle}
          isEditing={isEditing}
          className="text-lg font-semibold mb-4 text-[#000000]"
          inputClassName="text-lg font-semibold text-[#000000]"
          onValueChange={setCreateTitle}
        />

        <form onSubmit={handleSave}>
          <div className="mb-4">
            <EditableText
              storageKey="calendar:create:start"
              defaultValue={startLabel}
              isEditing={isEditing}
              className="block font-inter text-[#3f3f3F]"
              inputClassName="text-sm"
              onValueChange={setStartLabel}
              as="label"
            />
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-full bg-white font-inter text-[#3f3f3F]"
            />
          </div>

          <div className="mb-4">
            <EditableText
              storageKey="calendar:create:end"
              defaultValue={endLabel}
              isEditing={isEditing}
              className="block font-inter text-[#3f3f3F]"
              inputClassName="text-sm"
              onValueChange={setEndLabel}
              as="label"
            />
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-full bg-white font-inter text-[#3f3f3F]"
            />
          </div>

          <div className="mb-4">
            <EditableText
              storageKey="calendar:create:client"
              defaultValue={clientLabel}
              isEditing={isEditing}
              className="block font-inter text-[#3f3f3F]"
              inputClassName="text-sm"
              onValueChange={setClientLabel}
              as="label"
            />
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-full bg-white font-inter text-[#3f3f3F]"
            />
          </div>

          <div className="mb-4">
            <EditableText
              storageKey="calendar:create:location"
              defaultValue={locationLabel}
              isEditing={isEditing}
              className="block font-inter text-[#3f3f3F]"
              inputClassName="text-sm"
              onValueChange={setLocationLabel}
              as="label"
            />
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-full bg-white font-inter text-[#3f3f3F]"
            />
          </div>

          <div className="mb-4">
            <EditableText
              storageKey="calendar:create:description"
              defaultValue={descriptionLabel}
              isEditing={isEditing}
              className="block font-inter text-[#3f3f3F]"
              inputClassName="text-sm"
              onValueChange={setDescriptionLabel}
              as="label"
            />
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="border border-gray-300 p-2 rounded w-full bg-white font-inter text-[#3f3f3F]"
            />
          </div>

          <div className="flex justify-between">
            {isEditing ? (
              <EditableText
                storageKey="calendar:create:save"
                defaultValue={saveLabel}
                isEditing={isEditing}
                inputBaseClassName="calendrier-button text-white px-4 py-2 rounded bg-blue-500 flex items-center"
                inputClassName="text-white font-medium text-center"
                onValueChange={setSaveLabel}
              />
            ) : (
              <button
                type="submit"
                className="calendrier-button text-white px-4 py-2 rounded bg-blue-500 hover:bg-blue-700 flex items-center"
              >
                {isSaving ? <span>{savingLabel}</span> : saveLabel}
              </button>
            )}

            {isEditing ? (
              <EditableText
                storageKey="calendar:create:cancel"
                defaultValue={cancelLabel}
                isEditing={isEditing}
                inputBaseClassName="bg-gray-500 text-white px-4 py-2 rounded"
                inputClassName="text-white font-medium text-center"
                onValueChange={setCancelLabel}
              />
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                {cancelLabel}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Button;
