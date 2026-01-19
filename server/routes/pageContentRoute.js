import express from "express";
import { authorize } from "../middleware/auth.js";
import { Roles } from "../utils/Roles.js";
import {
  getAllowedPages,
  getPageContentByKey,
  upsertPageContentByKey,
} from "../controller/pageContentController.js";

export const router = express.Router();

// Anyone logged in (commercial/admin)
router.get("/pages", authorize(Roles.All), getAllowedPages);
router.get("/:pageKey", authorize(Roles.All), getPageContentByKey);

// Admin only
router.put("/:pageKey", authorize(Roles.Admin), upsertPageContentByKey);
