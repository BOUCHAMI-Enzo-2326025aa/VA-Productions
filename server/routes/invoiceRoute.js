import express from "express";
import {
  getInvoices,
  createFacture,
  getInvoicesByCompany,
  getInvoicesPdf,
  getAllClients,
  validateInvoice,
  getClientInvoices,
} from "../controller/invoiceController.js";

import { authorize } from "../middleware/auth.js";
import { Roles } from "../utils/Roles.js";

export const router = express.Router();

router.post("/create", authorize(Roles.All), createFacture);
router.get("/", authorize(Roles.All), getInvoices);
router.get("/compagnies", authorize(Roles.All), getAllClients);
router.get("/:entreprise", authorize(Roles.All), getInvoicesByCompany);
router.get("/pdf/:id", authorize(Roles.All), getInvoicesPdf);
router.get("/client/:id", authorize(Roles.All), getClientInvoices);
router.post("/validate/:id", authorize(Roles.All), validateInvoice);