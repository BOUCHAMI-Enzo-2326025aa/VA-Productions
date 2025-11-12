import Magazine from "../model/magazineModel.js";

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
    const { nom, image } = req.body;
    
    // Vérifier si un magazine avec ce nom existe déjà
    const existingMagazine = await Magazine.findOne({ 
      nom: { $regex: new RegExp(`^${nom}$`, 'i') } 
    });
    
    if (existingMagazine) {
      return res.status(400).json({ erreur: "Un magazine avec ce nom existe déjà" });
    }
    
    const magazine = await Magazine.create({
      nom,
      image,
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
    const { nom, image } = req.body;
    
    // Vérifier si un autre magazine avec ce nom existe déjà
    if (nom) {
      const existingMagazine = await Magazine.findOne({ 
        nom: { $regex: new RegExp(`^${nom}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existingMagazine) {
        return res.status(400).json({ erreur: "Un magazine avec ce nom existe déjà" });
      }
    }
    
    const updatedData = {};
    if (nom) updatedData.nom = nom;
    if (image) updatedData.image = image;
    updatedData.updatedAt = Date.now();
    
    const magazine = await Magazine.findByIdAndUpdate(
      id,
      updatedData,
      { new: true, runValidators: true }
    );
    
    if (!magazine) {
      return res.status(404).json({ erreur: "Magazine non trouvé" });
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
    
    const magazine = await Magazine.findByIdAndDelete(id);
    
    if (!magazine) {
      return res.status(404).json({ erreur: "Magazine non trouvé" });
    }
    
    res.status(200).json({ message: "Magazine supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du magazine:", error);
    res.status(500).json({ erreur: error.message });
  }
};
