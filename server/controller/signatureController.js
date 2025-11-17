import Signature from "../model/signatureModel.js";

// Récupérer la signature actuelle (une seule signature pour tout le système)
export const getSignature = async (req, res) => {
  try {
    // On récupère la dernière signature enregistrée
    const signature = await Signature.findOne().sort({ updatedAt: -1 });
    
    if (!signature) {
      return res.status(404).json({ 
        success: false, 
        message: "Aucune signature enregistrée" 
      });
    }

    res.status(200).json({
      success: true,
      signature: signature.signatureData,
      updatedAt: signature.updatedAt,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la signature:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur lors de la récupération de la signature" 
    });
  }
};

// Créer ou mettre à jour la signature (admin uniquement)
export const updateSignature = async (req, res) => {
  try {
    const { signatureData } = req.body;
    const userId = req.userId; // Extrait du token par le middleware authorize

    if (!signatureData) {
      return res.status(400).json({ 
        success: false, 
        message: "Données de signature manquantes" 
      });
    }

    // Vérifier si une signature existe déjà
    const existingSignature = await Signature.findOne();

    if (existingSignature) {
      // Mise à jour de la signature existante
      existingSignature.signatureData = signatureData;
      existingSignature.createdBy = userId;
      existingSignature.updatedAt = Date.now();
      await existingSignature.save();

      return res.status(200).json({
        success: true,
        message: "Signature mise à jour avec succès",
        signature: existingSignature.signatureData,
      });
    } else {
      // Création d'une nouvelle signature
      const newSignature = new Signature({
        signatureData,
        createdBy: userId,
      });
      await newSignature.save();

      return res.status(201).json({
        success: true,
        message: "Signature créée avec succès",
        signature: newSignature.signatureData,
      });
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la signature:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur lors de la mise à jour de la signature" 
    });
  }
};
