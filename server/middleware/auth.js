
import jsonwebtoken from "jsonwebtoken";
import { Roles, isRoleValid } from "../utils/Roles.js";

export const authorize = (permission) => {
  return (req, res, next) => {
    try {
      const token = req.cookies.token; 

      if (!token) {
        throw new Error("Token manquant ou expiré");      
      }

      const decodedToken = jsonwebtoken.verify(token, process.env.SECRET);

      req.user = decodedToken.user;

      if (!isRoleValid(decodedToken.user.role, permission)) {
        throw new Error("Permission invalide");
      }

      next();

    } catch (error) {
      return res.status(401).json({ error: "Accès non autorisé" });
    }
  };
};