import Magazine from "../model/magazineModel.js";
import Order from "../model/orderModel.js";
import Invoice from "../model/invoiceModel.js";
import User from "../model/userModel.js";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";

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
    
    // L'image peut venir soit d'un upload (req.file) soit d'une URL base64 (req.body.image)
    let imageData;
    
    if (req.file) {
      // Si un fichier a été uploadé, le convertir en base64
      const base64Image = req.file.buffer.toString('base64');
      imageData = `data:${req.file.mimetype};base64,${base64Image}`;
    } else if (req.body.image) {
      // Si une image base64 a été fournie directement
      imageData = req.body.image;
    } else {
      return res.status(400).json({ erreur: "Une image est requise" });
    }
    
    // Vérifier si un magazine avec ce nom existe déjà
    const existingMagazine = await Magazine.findOne({ 
      nom: { $regex: new RegExp(`^${nom}$`, 'i') } 
    });
    
    if (existingMagazine) {
      return res.status(400).json({ erreur: "Un magazine avec ce nom existe déjà" });
    }
    
    const magazine = await Magazine.create({
      nom,
      image: imageData,
    });
    
    res.status(201).json({ magazine });
  } catch (error) {
    console.error("Erreur lors de la création du magazine:", error);
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
        return res.status(400).json({ erreur: "Un magazine avec ce nom existe déjà" });
      }
    }
    
    const updatedData = {};
    if (trimmedName) updatedData.nom = trimmedName;
    
    // Gérer l'image
    if (req.file) {
      // Un nouveau fichier a été uploadé, le convertir en base64
      const base64Image = req.file.buffer.toString('base64');
      updatedData.image = `data:${req.file.mimetype};base64,${base64Image}`;
    } else if (req.body.image) {
      // Une nouvelle image base64 a été fournie
      updatedData.image = req.body.image;
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
    
    // L'image est stockée en base64 dans MongoDB, pas besoin de la supprimer séparément
    
    res.status(200).json({ message: "Magazine supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du magazine:", error);
    res.status(500).json({ erreur: error.message });
  }
};
