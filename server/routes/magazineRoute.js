import express from "express";
import {
  getAllMagazines,
  getMagazineById,
  createMagazine,
  updateMagazine,
  deleteMagazine,
} from "../controller/magazineController.js";

export const router = express.Router();

// Récupérer tous les magazines
router.get("/", getAllMagazines);

// Récupérer un magazine par ID
router.get("/:id", getMagazineById);

// Créer un nouveau magazine (admin only)
router.post("/create", createMagazine);

// Mettre à jour un magazine (admin only)
router.put("/:id", updateMagazine);

// Supprimer un magazine (admin only)
router.delete("/:id", deleteMagazine);
