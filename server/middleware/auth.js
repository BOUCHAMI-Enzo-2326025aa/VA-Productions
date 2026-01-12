
import jsonwebtoken from "jsonwebtoken";
import { Roles, isRoleValid } from "../utils/Roles.js";

const getTokenFromRequest = (req) => {
  const cookieToken = req.cookies?.token;
  if (cookieToken) return cookieToken;

  const authHeader = req.headers?.authorization;
  if (!authHeader) return null;

  // Accept both "Bearer <token>" and raw token
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();
};

export const authorize = (permission) => {
  return (req, res, next) => {
    try {
      const token = getTokenFromRequest(req);

      if (!token) {
        throw new Error("Token manquant");
      }

      const decodedToken = jsonwebtoken.verify(token, process.env.SECRET);

      req.user = decodedToken.user;

      if (!isRoleValid(decodedToken.user.role, permission)) {
        throw new Error("Permission invalide");
      }

      next();

    } catch (error) {
      return res.status(401).json({ error: error?.message || "Accès non autorisé" });
    }
  };
};