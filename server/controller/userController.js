import User from "../model/userModel.js";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import { sendMail } from "../utils/sendMail.js";
import crypto from "crypto";

const isPasswordStrong = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  return regex.test(password);
};

const createToken = (user) => {
  return jsonwebtoken.sign({ user }, process.env.SECRET, {
    expiresIn: "1000d",
  });
};

export const getAllUser = async (req, res) => {
  try {
    const userList = await User.find({}).sort({ nom: 1, prenom: 1 });
    res.status(200).json({ userList });
  } catch (error) {
    res.status(500).json({ erreur: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { nom, prenom, email, role } = req.body;

    if (!nom || !prenom || !email) {
      return res
        .status(400)
        .json({ erreur: "Nom, prénom et email sont requis." });
    }

    // Valider le rôle (par défaut: commercial)
    const userRole = role && (role === "admin" || role === "commercial") ? role : "commercial";

    const verificationCode = crypto.randomBytes(16).toString("hex");

    const verificationLink = `${process.env.FRONT_LINK}/user/verify/${email}/${verificationCode}`;

    const emailHtml = `
      <h1>Bienvenue chez V.A. Productions !</h1>
      <p>Bonjour ${prenom},</p>
      <p>Votre compte a été créé. Pour finaliser votre inscription et définir votre mot de passe, veuillez cliquer sur le lien ci-dessous :</p>
      <a href="${verificationLink}">Cliquez ici pour vérifier votre compte</a>
      <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
      <p>${verificationLink}</p>
      <p>Merci,</p>
      <p>L'équipe V.A. Productions</p>
    `;
    const emailText = `Bienvenue chez V.A. Productions ! Pour finaliser votre inscription, veuillez suivre ce lien : ${verificationLink}`;

    await sendMail(
      email,
      "Vérification de votre compte V.A. Productions",
      emailHtml,
      emailText
    );

    const user = await User.create({ nom, prenom, email, role: userRole, verificationCode });

    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ erreur: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Les champs ne peuvent pas être vides" });
    }

    const user = await User.findOne({
      $or: [{ username: username }, { email: username }],
    });

    // L'utilisateur n'existe pas
    if (!user) {
      return res.status(400).json({ message: "L'identifiant est incorrect" });
    }

    // L'utilisateur existe mais n'a pas encore défini de mot de passe
    if (!user.password) {
      return res.status(400).json({ message: "Ce compte n'a pas encore été activé." });
    }

    const match = await bcrypt.compare(password, user.password);

    // Le mot de passe est invalide
    if (!match) {
      return res.status(400).json({ message: "Le mot de passe est incorrect" });
    }

    // mot de passe valide on crée le token et on connecte l'utilisateur
    const token = createToken(user);
    res.status(200).json({ user: user, token: token });

  } catch (error) {
    res.status(501).json({ error: error.message });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const { password, confirmationCode, email } = req.body;

     if (!isPasswordStrong(password)) {
      return res.status(400).json({ 
        message: "Mot de passe trop faible. Il doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole." 
      });
    }

    // Cherche si un utilisateur correspond bien au code et à l'email
    const userExists = await User.findOne({ verificationCode: confirmationCode, email });

    if (userExists) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      // Met à jour l'utilisateur avec son nouveau mot de passe
      await User.updateOne({ email }, { $set: { password: hash }, $unset: { verificationCode: "" } });

      // Récupère l'utilisateur mis à jour pour créer un token valide
      const updatedUser = await User.findOne({ email });
      const token = createToken(updatedUser);

      res.status(200).json({ userId: updatedUser._id, user: updatedUser, token });
    } else {
      res.status(400).json({ message: "Code de vérification invalide" });
    }
  } catch (error) {
    console.log(error);
    res.status(501).json({ error: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, adminPassword } = req.body;

    // Valider le rôle
    if (!role || (role !== "admin" && role !== "commercial")) {
      return res.status(400).json({ erreur: "Rôle invalide. Utilisez 'admin' ou 'commercial'." });
    }

    // Vérifier que le mot de passe admin est fourni
    if (!adminPassword) {
      return res.status(400).json({ erreur: "Mot de passe administrateur requis." });
    }

    // Récupérer l'utilisateur admin depuis le token (middleware authorize l'a déjà validé)
    const token = req.headers["authorization"] || req.headers["Authorization"];
    const decodedToken = jsonwebtoken.verify(token, process.env.SECRET);
    const adminUser = await User.findById(decodedToken.user._id);

    if (!adminUser) {
      return res.status(401).json({ erreur: "Utilisateur administrateur non trouvé." });
    }

    // Vérifier le mot de passe de l'admin
    const passwordMatch = await bcrypt.compare(adminPassword, adminUser.password);
    if (!passwordMatch) {
      return res.status(401).json({ erreur: "Mot de passe administrateur incorrect." });
    }

    // Mettre à jour le rôle de l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ erreur: "Utilisateur non trouvé" });
    }

    res.status(200).json({ message: "Rôle mis à jour avec succès", user: updatedUser });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du rôle:", error);
    res.status(500).json({ erreur: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { adminPassword } = req.body;

    // Vérifier que le mot de passe admin est fourni
    if (!adminPassword) {
      return res.status(400).json({ erreur: "Mot de passe administrateur requis." });
    }

    // Récupérer l'utilisateur admin depuis le token
    const token = req.headers["authorization"] || req.headers["Authorization"];
    if (!token) {
      return res.status(401).json({ erreur: "Token d'authentification requis." });
    }

    const decodedToken = jsonwebtoken.verify(token, process.env.SECRET);
    const adminUser = await User.findById(decodedToken.user._id);

    if (!adminUser) {
      return res.status(401).json({ erreur: "Utilisateur administrateur non trouvé." });
    }

    // Vérifier le mot de passe de l'admin
    const passwordMatch = await bcrypt.compare(adminPassword, adminUser.password);
    if (!passwordMatch) {
      return res.status(401).json({ erreur: "Mot de passe administrateur incorrect." });
    }

    // Empêcher la suppression de son propre compte
    if (userId === adminUser._id.toString()) {
      return res.status(400).json({ erreur: "Vous ne pouvez pas supprimer votre propre compte." });
    }

    // Supprimer l'utilisateur
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ erreur: "Utilisateur non trouvé." });
    }

    res.status(200).json({ message: "Utilisateur supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error);
    res.status(500).json({ erreur: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { nom, prenom } = req.body;

    // Récupérer l'utilisateur depuis le token
    const token = req.headers["authorization"] || req.headers["Authorization"];
    if (!token) {
      return res.status(401).json({ erreur: "Token d'authentification requis." });
    }

    const decodedToken = jsonwebtoken.verify(token, process.env.SECRET);
    const userId = decodedToken.user._id;

    if (!nom || !prenom) {
      return res.status(400).json({ erreur: "Nom et prénom sont requis." });
    }

    // Mettre à jour le profil
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { nom, prenom },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ erreur: "Utilisateur non trouvé." });
    }

    // Créer un nouveau token avec les informations mises à jour
    const newToken = createToken(updatedUser);

    res.status(200).json({ 
      message: "Profil mis à jour avec succès", 
      user: updatedUser,
      token: newToken
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    res.status(500).json({ erreur: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Récupérer l'utilisateur depuis le token
    const token = req.headers["authorization"] || req.headers["Authorization"];
    if (!token) {
      return res.status(401).json({ erreur: "Token d'authentification requis." });
    }

    const decodedToken = jsonwebtoken.verify(token, process.env.SECRET);
    const userId = decodedToken.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ erreur: "L'ancien et le nouveau mot de passe sont requis." });
    }

    // Vérifier la force du nouveau mot de passe
    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({ 
        erreur: "Mot de passe trop faible. Il doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole." 
      });
    }

    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ erreur: "Utilisateur non trouvé." });
    }

    // Vérifier l'ancien mot de passe
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ erreur: "Mot de passe actuel incorrect." });
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    // Mettre à jour le mot de passe
    await User.findByIdAndUpdate(userId, { password: hash });

    res.status(200).json({ message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error);
    res.status(500).json({ erreur: error.message });
  }
};