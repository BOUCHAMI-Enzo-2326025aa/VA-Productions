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

const normalizeType = (body, fallback = false) => {
  if (typeof body.isResultAccount === "boolean") {
    return body.isResultAccount;
  }

  if (typeof body.type === "string") {
    const lowered = body.type.toLowerCase();
    if (lowered.includes("result")) {
      return true;
    }
    if (lowered.includes("charge")) {
      return false;
    }
  }

  return fallback;
};

export const getCharges = async (req, res) => {
  const { type } = req.query;
  const wantsResult = typeof type === "string" && type.toLowerCase() === "result";

  const filter = wantsResult
    ? { isResultAccount: true }
    : {
        $or: [
          { isResultAccount: false },
          { isResultAccount: { $exists: false } },
        ],
      };

  const charges = await Charge.find(filter).sort({ compte: 1 });
  res.status(200).json({ charges });
};

export const createCharge = async (req, res) => {
  try {
    const { compte, nom, montantPrecedent, montantPrevu, montantResultat } = req.body;

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

    const isResultAccount = normalizeType(req.body, false);

    const payload = {
      compte: compte.trim(),
      nom: nom.trim(),
      isResultAccount,
    };

    if (isResultAccount) {
      payload.montantResultat = parseAmount(
        montantResultat ?? montantPrevu ?? req.body.montant,
        "montant"
      );
      payload.montantPrecedent = 0;
      payload.montantPrevu = 0;
    } else {
      payload.montantPrecedent = parseAmount(
        montantPrecedent,
        "montantPrecedent"
      );
      payload.montantPrevu = parseAmount(montantPrevu, "montantPrevu");
      payload.montantResultat = 0;
    }

    const charge = await Charge.create(payload);
    res.status(201).json({ charge });
  } catch (error) {
    console.error("createCharge error:", error);
    res
      .status(400)
      .json({ error: error.message || "Erreur lors de la création." });
  }
};

export const updateCharge = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ error: "Identifiant de charge invalide." });
    }

    const charge = await Charge.findById(id);

    if (!charge) {
      return res.status(404).json({ error: "Charge introuvable." });
    }

    const targetType = normalizeType(req.body, charge.isResultAccount);

    const { compte, nom, montantPrecedent, montantPrevu, montantResultat } = req.body;

    if (compte !== undefined) {
      if (typeof compte !== "string" || !/^\d{6}$/.test(compte)) {
        return res
          .status(400)
          .json({ error: "Le compte doit contenir exactement 6 chiffres." });
      }
      charge.compte = compte.trim();
    }

    if (nom !== undefined) {
      if (typeof nom !== "string" || !nom.trim()) {
        return res
          .status(400)
          .json({ error: "Le nom du compte est obligatoire." });
      }
      charge.nom = nom.trim();
    }

    charge.isResultAccount = targetType;

    if (targetType) {
      if (montantResultat !== undefined || montantPrevu !== undefined || req.body.montant !== undefined) {
        charge.montantResultat = parseAmount(
          montantResultat ?? montantPrevu ?? req.body.montant,
          "montant"
        );
      }
      charge.montantPrecedent = 0;
      charge.montantPrevu = 0;
    } else {
      if (montantPrecedent !== undefined) {
        charge.montantPrecedent = parseAmount(
          montantPrecedent,
          "montantPrecedent"
        );
      }

      if (montantPrevu !== undefined) {
        charge.montantPrevu = parseAmount(montantPrevu, "montantPrevu");
      }

      if (montantResultat !== undefined) {
        charge.montantResultat = parseAmount(montantResultat, "montant");
      }
    }

    const savedCharge = await charge.save();
    res.status(200).json({ charge: savedCharge });
  } catch (error) {
    console.error("updateCharge error:", error);
    res
      .status(400)
      .json({ error: error.message || "Erreur lors de la mise à jour." });
  }
};

export const deleteCharge = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ error: "Identifiant de charge invalide." });
    }

    const charge = await Charge.findByIdAndDelete(id);

    if (!charge) {
      return res.status(404).json({ error: "Charge introuvable." });
    }

    res.status(204).send();
  } catch (error) {
    console.error("deleteCharge error:", error);
    res
      .status(400)
      .json({ error: error.message || "Erreur lors de la suppression." });
  }
};
