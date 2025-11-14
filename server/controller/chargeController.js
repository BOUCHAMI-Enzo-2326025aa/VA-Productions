import mongoose from "mongoose";
import Charge from "../model/chargeModel.js";

const parseAmount = (value, field) => {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Le champ ${field} doit être un nombre positif.`);
  }

  return parsed;
};

export const getCharges = async (_req, res) => {
  const charges = await Charge.find().sort({ compte: 1 });
  res.status(200).json({ charges });
};

export const createCharge = async (req, res) => {
  try {
    const { compte, nom, montantPrecedent, montantPrevu } = req.body;

    if (typeof compte !== "string" || !/^\d{6}$/.test(compte)) {
      return res
        .status(400)
        .json({ error: "Le compte doit contenir exactement 6 chiffres." });
    }

    if (typeof nom !== "string" || !nom.trim()) {
      return res
        .status(400)
        .json({ error: "Le nom du compte est obligatoire." });
    }

    const payload = {
      compte: compte.trim(),
      nom: nom.trim(),
      montantPrecedent: parseAmount(montantPrecedent, "montantPrecedent"),
      montantPrevu: parseAmount(montantPrevu, "montantPrevu"),
    };

    const charge = await Charge.create(payload);
    res.status(201).json({ charge });
  } catch (error) {
    console.error("createCharge error:", error);
    res.status(400).json({ error: error.message || "Erreur lors de la création." });
  }
};

export const updateCharge = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Identifiant de charge invalide." });
    }

    const updates = {};
    const { compte, nom, montantPrecedent, montantPrevu } = req.body;

    if (compte !== undefined) {
      if (typeof compte !== "string" || !/^\d{6}$/.test(compte)) {
        return res
          .status(400)
          .json({ error: "Le compte doit contenir exactement 6 chiffres." });
      }
      updates.compte = compte.trim();
    }

    if (nom !== undefined) {
      if (typeof nom !== "string" || !nom.trim()) {
        return res
          .status(400)
          .json({ error: "Le nom du compte est obligatoire." });
      }
      updates.nom = nom.trim();
    }

    if (montantPrecedent !== undefined) {
      updates.montantPrecedent = parseAmount(
        montantPrecedent,
        "montantPrecedent"
      );
    }

    if (montantPrevu !== undefined) {
      updates.montantPrevu = parseAmount(montantPrevu, "montantPrevu");
    }

    const charge = await Charge.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!charge) {
      return res.status(404).json({ error: "Charge introuvable." });
    }

    res.status(200).json({ charge });
  } catch (error) {
    console.error("updateCharge error:", error);
    res.status(400).json({ error: error.message || "Erreur lors de la mise à jour." });
  }
};

export const deleteCharge = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Identifiant de charge invalide." });
    }

    const charge = await Charge.findByIdAndDelete(id);

    if (!charge) {
      return res.status(404).json({ error: "Charge introuvable." });
    }

    res.status(204).send();
  } catch (error) {
    console.error("deleteCharge error:", error);
    res.status(400).json({ error: error.message || "Erreur lors de la suppression." });
  }
};
