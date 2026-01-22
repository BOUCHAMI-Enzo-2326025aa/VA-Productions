import express from "express";
import { getPageContent, upsertPageContent } from "../controller/pageContentController.js";
import { authorize } from "../middleware/auth.js";
import { Roles } from "../utils/Roles.js";

export const router = express.Router();

router.get("/:pageKey", authorize(Roles.Commercial), getPageContent);
router.put("/:pageKey", authorize(Roles.Admin), upsertPageContent);
