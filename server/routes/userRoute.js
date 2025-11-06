import express from "express";
import {
  createUser,
  getAllUser,
  loginUser,
  verifyUser,
  updateUserRole,
} from "../controller/userController.js";
import { authorize } from "../middleware/auth.js";
import { Roles } from "../utils/Roles.js";

export const router = express.Router();

router.get("/", authorize(Roles.Admin), getAllUser);

router.post("/create", authorize(Roles.Admin), createUser);

router.put("/:userId/role", authorize(Roles.Admin), updateUserRole);

router.post("/login", loginUser);

router.post("/verify", verifyUser);

export { router };