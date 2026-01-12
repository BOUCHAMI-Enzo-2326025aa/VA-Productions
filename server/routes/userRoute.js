import express from "express";
import {
  createUser,
  getAllUser,
  loginUser,
  verifyUser,
  updateUserRole,
  deleteUser,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
} from "../controller/userController.js";
import { authorize } from "../middleware/auth.js";
import { Roles } from "../utils/Roles.js";
import { validateLogin, validateCreateUser } from "../middleware/validation.js";

export const router = express.Router();

router.get("/", authorize(Roles.Admin), getAllUser);

router.post("/create", authorize(Roles.Admin), validateCreateUser, createUser);

router.put("/:userId/role", authorize(Roles.Admin), updateUserRole);

router.delete("/:userId", authorize(Roles.Admin), deleteUser);

router.post("/login", validateLogin, loginUser);

router.post("/verify", verifyUser);

router.put("/profile", authorize(Roles.Commercial), updateProfile);

router.put("/password", authorize(Roles.Commercial), changePassword);

// Mot de passe oublié
router.post("/password/forgot", requestPasswordReset);
router.post("/password/reset", resetPassword);

