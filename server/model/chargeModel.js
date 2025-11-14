import mongoose from "mongoose";

const chargeSchema = new mongoose.Schema(
  {
    compte: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{6}$/, "Le compte doit contenir exactement 6 chiffres."],
    },
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    montantPrecedent: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Le montant précédent ne peut pas être négatif."],
    },
    montantPrevu: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Le montant prévu ne peut pas être négatif."],
    },
  },
  {
    timestamps: true,
  }
);

const Charge = mongoose.model("Charge", chargeSchema);

export default Charge;
