import jsonwebtoken from "jsonwebtoken";
import { Roles, isRoleValid } from "../utils/Roles.js";

export const authorize = (permission) => {
  return (req, res, next) => {
    try {
      const token = req.headers["Authorization"] || req.headers["authorization"];

      console.log("Middleware: Token reçu:", token);

      if (!token) {
        throw new Error("Token manquant");      
      }

      const decodedToken = jsonwebtoken.verify(token, process.env.SECRET);

      console.log("Middleware: Contenu du token décodé:", decodedToken);

      req.user = decodedToken.user;

      // On vérifie si l'utilisateur a la permission requise
      if (!isRoleValid(decodedToken.user.role, permission)) {
        throw new Error("Permission invalide");
      }

      next();

    } catch (error) {
      console.log("Erreur d'autorisation:", error.message);
      return res.status(401).json({ error: "Accès non autorisé : " + error.message });
    }
  };
};
