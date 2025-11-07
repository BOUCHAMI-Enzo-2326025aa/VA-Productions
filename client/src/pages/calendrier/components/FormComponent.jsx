// FormComponent.js
import React, { useState } from "react";
import Notification from "./Notification";
// Composant FormComponent : Formulaire permettant de modifier ou supprimer un événement
const FormComponent = ({
  formData,
  handleChange,
  handleSaveEdit,
  onDeleteEvent,
  onClose,
  isOpen,
}) => {
  const [notification, setNotification] = useState(null);
  // Gestion de la suppression d'un événement
  const handleDelete = () => {
    onDeleteEvent();
    setNotification({
      message: "Événement supprimé avec succès",
      type: "error",
    });

    setTimeout(() => {
      onClose();
    }, 3000);
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-[20%] z-30 bg-white p-4">
      ,<h2 className="text-lg font-semibold mb-4">Modifier l'événement</h2>
      <form
        onSubmit={(e) => {
          handleSaveEdit(e);
          onClose();
        }}
      >
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
        <div className="mb-4">
          <label className="block font-inter text-[#3f3f3F]">
            Date et heure de début
          </label>
          <input
            type="datetime-local"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded w-full bg-white font-inter text-[#3f3f3F]"
          />
        </div>
        <div className="mb-4">
          <label className="block font-inter text-[#3f3f3F]">
            Date et heure de fin
          </label>
          <input
            type="datetime-local"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded w-full bg-white font-inter text-[#3f3f3F]"
          />
        </div>
        <div className="mb-4">
          <label className="block font-inter text-[#3f3f3F]">Client</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded w-full bg-white font-inter text-[#3f3f3F]"
          />
        </div>
        <div className="mb-4">
          <label className="block font-inter text-[#3f3f3F]">Lieu</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded w-full bg-white font-inter text-[#3f3f3F]"
          />
        </div>
        <div className="mb-4">
          <label className="block font-inter text-[#3f3f3F]">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="border border-gray-300 p-2 rounded w-full bg-white font-inter text-[#3f3f3F]"
          />
        </div>

        <div className="flex justify-between">
          <button
            type="submit"
            className="calendrier-button text-white px-4 py-2 rounded bg-blue-500 hover:bg-blue-700"
          >
            Sauvegarder
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Supprimer
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormComponent;
