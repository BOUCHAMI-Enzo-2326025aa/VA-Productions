import express from "express";
import { authorize } from "../middleware/auth.js";
import { Roles } from "../utils/Roles.js";
import {
  createCharge,
  deleteCharge,
  getCharges,
  updateCharge,
} from "../controller/chargeController.js";

const router = express.Router();

router.get("/", authorize(Roles.Admin), getCharges);
router.post("/", authorize(Roles.Admin), createCharge);
router.put("/:id", authorize(Roles.Admin), updateCharge);
router.delete("/:id", authorize(Roles.Admin), deleteCharge);

export default router;
