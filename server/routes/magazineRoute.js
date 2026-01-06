import express from "express";
import {
  getAllMagazines,
  getMagazineById,
  createMagazine,
  updateMagazine,
  deleteMagazine,
} from "../controller/magazineController.js";
import { uploadMagazineCover } from "../middleware/uploadMiddleware.js";

export const router = express.Router();

// Récupérer tous les magazines
router.get("/", getAllMagazines);

// Récupérer un magazine par ID
router.get("/:id", getMagazineById);

// Créer un nouveau magazine (admin only) - avec upload optionnel
router.post("/create", uploadMagazineCover.single("image"), createMagazine);

// Mettre à jour un magazine (admin only) - avec upload optionnel
router.put("/:id", uploadMagazineCover.single("image"), updateMagazine);

// Supprimer un magazine (admin only)
router.delete("/:id", deleteMagazine);
