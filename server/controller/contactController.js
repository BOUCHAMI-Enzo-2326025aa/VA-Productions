import Contact from "../model/contactModel.js";
import User from "../model/userModel.js";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";

export const getAllContacts = async (req, res) => {
  try {
    const contactList = await Contact.find({}).sort({ company: 1 });
    res.status(200).json({ contactList: contactList });
  } catch (error) {
    console.log(error);
    res.status(500).json({ erreur: error.message });
  }
};

export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id);
    res.status(200).json(contact);
  } catch (error) {
    console.log(error);
    res.status(500).json({ erreur: error.message });
  }
};

export const createContact = async (req, res) => {
  try {
    const {
      company,
      name,
      surname,
      email,
      phoneNumber,
      siret,
      numTVA,
      delaisPaie,
      comments,
      lastCall,
      status,
    } = req.body;

    const sanitizedDelaisPaie =
      typeof delaisPaie === "string" ? delaisPaie.trim() : delaisPaie;

    const contact = await Contact.create({
      company,
      name,
      surname,
      email,
      phoneNumber,
      siret,
      numTVA,
      delaisPaie:
        sanitizedDelaisPaie && sanitizedDelaisPaie.length > 0
          ? sanitizedDelaisPaie
          : undefined,
      comments,
      lastCall,
      status,
    });
    res.status(200).json({ contact });
  } catch (error) {
    console.log(error);
    res.status(500).json({ erreur: error.message });
  }
};

export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      company,
      name,
      surname,
      email,
      phoneNumber,
      siret,
      numTVA,
      delaisPaie,
      comments,
      status,
    } = req.body;

    const updatedData = {};
    if (company) updatedData.company = company;
    if (name) updatedData.name = name;
    if (surname) updatedData.surname = surname;
    if (email) updatedData.email = email;
    if (phoneNumber) updatedData.phoneNumber = phoneNumber;
    if (siret !== undefined) updatedData.siret = siret;
    if (numTVA !== undefined) updatedData.numTVA = numTVA;
    if (delaisPaie !== undefined) {
      updatedData.delaisPaie =
        typeof delaisPaie === "string" ? delaisPaie.trim() : delaisPaie;
    }
    if (comments) updatedData.comments = comments;
    if (status) updatedData.status = status;

    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      {
        $set: updatedData,
      },
      { new: true, runValidators: true }
    );
    res.status(200).json({ updatedContact });
  } catch (error) {
    console.log(error);
    res.status(500).json({ erreur: error.message });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminPassword } = req.body || {};

    // Require admin password for deletion
    if (!adminPassword) {
      return res.status(400).json({ erreur: "Mot de passe administrateur requis." });
    }

    // Verify token and admin user
    const token = req.headers["authorization"] || req.headers["Authorization"];
    if (!token) {
      return res.status(401).json({ erreur: "Token d'authentification requis pour cette action." });
    }

    let decoded;
    try {
      decoded = jsonwebtoken.verify(token, process.env.SECRET);
    } catch (err) {
      return res.status(401).json({ erreur: "Token invalide." });
    }

  const adminUser = await User.findById(decoded.user._id);
    if (!adminUser) {
      return res.status(401).json({ erreur: "Utilisateur admin introuvable." });
    }

    const passwordMatch = await bcrypt.compare(adminPassword, adminUser.password);
    if (!passwordMatch) {
      return res.status(401).json({ erreur: "Mot de passe utilisateur incorrect." });
    }

    const deletedContact = await Contact.findByIdAndDelete(id);
    if (!deletedContact) {
      return res.status(400).send(`Le contact (${id}) est introuvable !`);
    }

    return res.status(200).send(`Le contact ayant comme id ${id} vient d'être supprimé !`);
  } catch (error) {
    console.log(error);
    res.status(500).json({ erreur: error.message });
  }
};
