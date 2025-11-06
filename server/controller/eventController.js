import eventModel from "../model/eventModel.js";

// Créer un nouvel événement
export const createEvent = async (req, res) => {
  try {
    const newEvent = new eventModel(req.body);
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Erreur lors de la sauvegarde:", error.message);
    res.status(400).json({ message: error.message });
  }
};

// Récupérer tous les événements
export const getEvents = async (req, res) => {
  try {
    const events = await eventModel.find().sort({ startTime: 1 });
    res.status(200).json(events);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Mettre à jour un événement
export const updateEvent = async (req, res) => {
  try {
    const updatedEvent = await eventModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer un événement
export const deleteEvent = async (req, res) => {
  try {
    await eventModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Événement supprimé" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
