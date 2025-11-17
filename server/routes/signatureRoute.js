import express from "express";
import { getSignature, updateSignature } from "../controller/signatureController.js";
import { authorize } from "../middleware/authorize.js";
import { Roles } from "../utils/roles.js";

const router = express.Router();

// Récupérer la signature (tous les utilisateurs authentifiés)
router.get("/", authorize(Roles.Commercial), getSignature);

// Créer ou mettre à jour la signature (admin uniquement)
router.post("/", authorize(Roles.Admin), updateSignature);

export default router;
