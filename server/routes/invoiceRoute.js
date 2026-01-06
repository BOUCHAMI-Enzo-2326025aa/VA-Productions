import express from "express";
import { sendEInvoice } from '../controller/eInvoiceController.js';
import {
  getInvoices,
  createFacture,
  getInvoicesByCompany,
  getInvoicesPdf,
  getAllClients,
  validateInvoice,
  getClientInvoices,
  getOverdueInvoices,
} from "../controller/invoiceController.js";

import { authorize } from "../middleware/auth.js";
import { Roles } from "../utils/Roles.js";

export const router = express.Router();

router.get("/", authorize(Roles.All), getInvoices);
router.post("/create", authorize(Roles.All), createFacture);
router.get("/compagnies", authorize(Roles.All), getAllClients);
router.get("/overdue", authorize(Roles.All), getOverdueInvoices);
router.get("/client/:id", authorize(Roles.All), getClientInvoices);
router.get("/pdf/:id", authorize(Roles.All), getInvoicesPdf); 
router.post("/validate/:id", authorize(Roles.All), validateInvoice);
router.get("/:entreprise", authorize(Roles.All), getInvoicesByCompany);
router.post("/:id/send-einvoice", authorize(Roles.All), sendEInvoice);