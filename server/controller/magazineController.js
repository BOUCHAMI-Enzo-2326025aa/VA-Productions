import Magazine from "../model/magazineModel.js";
import Order from "../model/orderModel.js";
import Invoice from "../model/invoiceModel.js";
import User from "../model/userModel.js";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";

// Récupérer tous les magazines
export const getAllMagazines = async (req, res) => {
  try {
    const magazines = await Magazine.find({}).sort({ nom: 1 });
    res.status(200).json({ magazines });
  } catch (error) {
    console.error("Erreur lors de la récupération des magazines:", error);
    res.status(500).json({ erreur: error.message });
  }
};

// Récupérer un magazine par ID
export const getMagazineById = async (req, res) => {
  try {
    const { id } = req.params;
    const magazine = await Magazine.findById(id);
    
    if (!magazine) {
      return res.status(404).json({ erreur: "Magazine non trouvé" });
    }
    
    res.status(200).json(magazine);
  } catch (error) {
    console.error("Erreur lors de la récupération du magazine:", error);
    res.status(500).json({ erreur: error.message });
  }
};

// Créer un nouveau magazine
export const createMagazine = async (req, res) => {
  try {
    const { nom } = req.body;
    
    // L'image peut venir soit d'un upload (req.file) soit d'une URL (req.body.image)
    let imageUrl;
    let cloudinaryPublicId = null;
    
    if (req.file) {
      // Si un fichier a été uploadé sur Cloudinary
      imageUrl = req.file.path; // Cloudinary renvoie l'URL complète dans req.file.path
      cloudinaryPublicId = req.file.filename; // L'ID public Cloudinary pour supprimer plus tard
    } else if (req.body.image) {
      // Si une URL externe a été fournie
      imageUrl = req.body.image;
    } else {
      return res.status(400).json({ erreur: "Une image est requise" });
    }
    
    // Vérifier si un magazine avec ce nom existe déjà
    const existingMagazine = await Magazine.findOne({ 
      nom: { $regex: new RegExp(`^${nom}$`, 'i') } 
    });
    
    if (existingMagazine) {
      // Supprimer l'image Cloudinary si le nom existe déjà
      if (cloudinaryPublicId) {
        await cloudinary.uploader.destroy(cloudinaryPublicId);
      }
      return res.status(400).json({ erreur: "Un magazine avec ce nom existe déjà" });
    }
    
    const magazine = await Magazine.create({
      nom,
      image: imageUrl,
    });
    
    res.status(201).json({ magazine });
  } catch (error) {
    console.error("Erreur lors de la création du magazine:", error);
    // Supprimer l'image Cloudinary en cas d'erreur
    if (req.file && req.file.filename) {
      await cloudinary.uploader.destroy(req.file.filename);
    }
    res.status(500).json({ erreur: error.message });
  }
};

// Mettre à jour un magazine
export const updateMagazine = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom } = req.body;
    
    // Récupérer le magazine existant
    const existingMag = await Magazine.findById(id);
    if (!existingMag) {
      // Supprimer l'image Cloudinary si le magazine n'existe pas
      if (req.file && req.file.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(404).json({ erreur: "Magazine non trouvé" });
    }
    
    // Vérifier si un autre magazine avec ce nom existe déjà
    const trimmedName = typeof nom === "string" ? nom.trim() : nom;

    if (trimmedName) {
      const duplicateMagazine = await Magazine.findOne({ 
        nom: { $regex: new RegExp(`^${trimmedName}$`, "i") },
        _id: { $ne: id }
      });
      
      if (duplicateMagazine) {
        // Supprimer l'image Cloudinary si le nom existe déjà
        if (req.file && req.file.filename) {
          await cloudinary.uploader.destroy(req.file.filename);
        }
        return res.status(400).json({ erreur: "Un magazine avec ce nom existe déjà" });
      }
    }
    
    const updatedData = {};
  if (trimmedName) updatedData.nom = trimmedName;
    
    // Extraire l'ID public de l'ancienne image Cloudinary (si c'en est une)
    let oldCloudinaryPublicId = null;
    if (existingMag.image && existingMag.image.includes('cloudinary.com')) {
      // Extraire le public_id depuis l'URL Cloudinary
      const urlParts = existingMag.image.split('/');
      const fileNameWithExt = urlParts[urlParts.length - 1];
      const folderPath = urlParts.slice(urlParts.indexOf('va-productions'), -1).join('/');
      oldCloudinaryPublicId = `${folderPath}/${fileNameWithExt.split('.')[0]}`;
    }
    
    // Gérer l'image
    if (req.file) {
      // Un nouveau fichier a été uploadé sur Cloudinary
      updatedData.image = req.file.path; // URL complète Cloudinary
      
      // Supprimer l'ancienne image Cloudinary
      if (oldCloudinaryPublicId) {
        await cloudinary.uploader.destroy(oldCloudinaryPublicId);
      }
    } else if (req.body.image) {
      // Une nouvelle URL externe a été fournie
      updatedData.image = req.body.image;
      
      // Supprimer l'ancienne image Cloudinary
      if (oldCloudinaryPublicId) {
        await cloudinary.uploader.destroy(oldCloudinaryPublicId);
      }
    }
    
    updatedData.updatedAt = Date.now();
    
    const magazine = await Magazine.findByIdAndUpdate(
      id,
      updatedData,
      { new: true, runValidators: true }
    );

    const newName = magazine?.nom;
    if (trimmedName && newName && newName !== existingMag.nom) {
      const oldName = existingMag.nom;

      await Promise.all([
        Order.updateMany(
          { "items.supportName": oldName },
          {
            $set: {
              "items.$[item].supportName": newName,
            },
          },
          {
            arrayFilters: [{ "item.supportName": oldName }],
          }
        ),
        Order.updateMany(
          { "supportList.supportName": oldName },
          {
            $set: {
              "supportList.$[support].supportName": newName,
            },
          },
          {
            arrayFilters: [{ "support.supportName": oldName }],
          }
        ),
        Invoice.updateMany(
          { "supportList.supportName": oldName },
          {
            $set: {
              "supportList.$[support].supportName": newName,
            },
          },
          {
            arrayFilters: [{ "support.supportName": oldName }],
          }
        ),
      ]);
    }
    
    res.status(200).json({ magazine });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du magazine:", error);
    // Supprimer l'image Cloudinary en cas d'erreur
    if (req.file && req.file.filename) {
      await cloudinary.uploader.destroy(req.file.filename);
    }
    res.status(500).json({ erreur: error.message });
  }
};

// Supprimer un magazine
export const deleteMagazine = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminPassword } = req.body;
    
    // Vérifier que le mot de passe admin est fourni
    if (!adminPassword) {
      return res.status(400).json({ erreur: "Le mot de passe administrateur est requis" });
    }
    
    // Vérifier le mot de passe de l'admin
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ erreur: "Token manquant" });
    }
    
    let decoded;
    try {
      decoded = jsonwebtoken.verify(token, process.env.SECRET);
    } catch (err) {
      return res.status(401).json({ erreur: "Token invalide" });
    }
    
    const admin = await User.findById(decoded.user._id);
    
    if (!admin) {
      return res.status(401).json({ erreur: "Utilisateur administrateur non trouvé" });
    }
    
    if (admin.role !== "admin") {
      return res.status(403).json({ erreur: "Accès refusé. Seuls les administrateurs peuvent supprimer des magazines" });
    }
    
    const isPasswordValid = await bcrypt.compare(adminPassword, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ erreur: "Mot de passe administrateur incorrect" });
    }
    
    const magazine = await Magazine.findByIdAndDelete(id);
    
    if (!magazine) {
      return res.status(404).json({ erreur: "Magazine non trouvé" });
    }
    
    // Supprimer l'image Cloudinary si c'en est une
    if (magazine.image && magazine.image.includes('cloudinary.com')) {
      // Extraire le public_id depuis l'URL Cloudinary
      const urlParts = magazine.image.split('/');
      const fileNameWithExt = urlParts[urlParts.length - 1];
      const folderPath = urlParts.slice(urlParts.indexOf('va-productions'), -1).join('/');
      const publicId = `${folderPath}/${fileNameWithExt.split('.')[0]}`;
      
      await cloudinary.uploader.destroy(publicId);
    }
    
    res.status(200).json({ message: "Magazine supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du magazine:", error);
    res.status(500).json({ erreur: error.message });
  }
};
