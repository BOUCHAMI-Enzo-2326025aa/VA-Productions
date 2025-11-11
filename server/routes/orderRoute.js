import express from "express";
import {
  createOrder,
  getOrders,
  getOrderPdf,
  getOrdersByEntreprise,
  generateOrder,
  validateOrder,
  cancelOrder,
} from "../controller/orderController.js";

import { authorize } from "../middleware/auth.js";
import { Roles } from "../utils/Roles.js";

export const router = express.Router();

router.post("/create", authorize(Roles.All), createOrder);
router.get("/", authorize(Roles.All), getOrders);
router.get("/:entreprise", authorize(Roles.All), getOrdersByEntreprise);
router.post("/generate-order", authorize(Roles.All), generateOrder);
router.get("/pdf/:id", authorize(Roles.All), getOrderPdf);
router.post("/validate", authorize(Roles.All), validateOrder);
router.post("/cancel", authorize(Roles.All), cancelOrder);
