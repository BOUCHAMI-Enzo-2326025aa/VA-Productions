import multer from "multer";

// Configuration du stockage en mémoire pour conversion en base64
const storage = multer.memoryStorage();

// Filtre pour accepter uniquement les images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WEBP."), false);
  }
};

// Configuration de multer pour stockage en mémoire
export const uploadMagazineCover = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5MB
  },
});
