import User from "../model/userModel.js";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import { sendMail } from "../utils/sendMail.js";
import crypto from "crypto";

const COOKIE_OPTIONS = {
  httpOnly: true, 
  secure: process.env.NODE_ENV === "production", 
  sameSite: "lax", 
  maxAge: 3 * 24 * 60 * 60 * 1000 
};

const isPasswordStrong = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  return regex.test(password);
};

const createToken = (_id, role) => {
  return jsonwebtoken.sign({ user: { _id, role } }, process.env.SECRET, {
    expiresIn: "3d",
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
    // vérification email unique
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(409).json({ erreur: "Un utilisateur avec cet email existe déjà." });
    }

    const emailHtml = `
      <h1>Bienvenue chez V.A. Productions !</h1>
      <p>Bonjour ${prenom},</p>
      <p>Votre compte a été créé. Pour finaliser votre inscription et définir votre mot de passe, veuillez cliquer sur le lien ci-dessous :</p>
      <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #3F3F3F; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">Vérifier mon compte</a>
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

    const user = await User.findOne({
      $or: [{ username: username }, { email: username }],
    });

    if (!user) {
      return res.status(400).json({ message: "L'identifiant ou le mot de passe est incorrect" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Ce compte n'a pas encore été activé." });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "L'identifiant ou le mot de passe est incorrect" });
    }

    const token = createToken(user._id, user.role);
    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(200).json({ 
      _id: user._id,
      email: user.email,
      role: user.role,
      nom: user.nom,
      prenom: user.prenom,
      message: "Connexion réussie" 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const logoutUser = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0) // expire immédiatement
  });
  res.status(200).json({ message: "Déconnecté avec succès" });
};

export const verifyUser = async (req, res) => {
  try {
    const { password, confirmationCode, email } = req.body;

    if (!isPasswordStrong(password)) {
      return res.status(400).json({ 
        message: "Mot de passe trop faible. Il doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole." 
      });
    }

    const userExists = await User.findOne({ verificationCode: confirmationCode, email });

    if (userExists) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      await User.updateOne({ email }, { $set: { password: hash }, $unset: { verificationCode: "" } });
      const updatedUser = await User.findOne({ email });

      const token = createToken(updatedUser._id, updatedUser.role);
      res.cookie("token", token, COOKIE_OPTIONS);

      res.status(200).json({ 
        userId: updatedUser._id, 
        user: updatedUser 
      });
    } else {
      res.status(400).json({ message: "Code de vérification invalide" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, adminPassword } = req.body;

    if (!role || (role !== "admin" && role !== "commercial")) {
      return res.status(400).json({ erreur: "Rôle invalide." });
    }
    if (!adminPassword) {
      return res.status(400).json({ erreur: "Mot de passe administrateur requis." });
    }

    const adminUser = await User.findById(req.user._id);

    if (!adminUser) {
      return res.status(401).json({ erreur: "Admin non trouvé." });
    }

    const passwordMatch = await bcrypt.compare(adminPassword, adminUser.password);
    if (!passwordMatch) {
      return res.status(401).json({ erreur: "Mot de passe administrateur incorrect." });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { role }, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ erreur: "Utilisateur non trouvé" });
    }

    res.status(200).json({ message: "Rôle mis à jour avec succès", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { adminPassword } = req.body;

    if (!adminPassword) {
      return res.status(400).json({ erreur: "Mot de passe administrateur requis." });
    }

    const adminUser = await User.findById(req.user._id);

    if (!adminUser) {
      return res.status(401).json({ erreur: "Admin non trouvé." });
    }

    const passwordMatch = await bcrypt.compare(adminPassword, adminUser.password);
    if (!passwordMatch) {
      return res.status(401).json({ erreur: "Mot de passe administrateur incorrect." });
    }

    if (userId === adminUser._id.toString()) {
      return res.status(400).json({ erreur: "Vous ne pouvez pas supprimer votre propre compte." });
    }

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ erreur: "Utilisateur non trouvé." });
    }

    res.status(200).json({ message: "Utilisateur supprimé avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { nom, prenom } = req.body;
    // On utilise l'ID de l'utilisateur connecté via le cookie
    const userId = req.user._id;

    if (!nom || !prenom) {
      return res.status(400).json({ erreur: "Nom et prénom sont requis." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { nom, prenom },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ erreur: "Utilisateur non trouvé." });
    }

    // On régénère le token (et donc le cookie) car les infos peuvent avoir changé
    const newToken = createToken(updatedUser._id, updatedUser.role);
    res.cookie("token", newToken, COOKIE_OPTIONS);

    res.status(200).json({ 
      message: "Profil mis à jour avec succès", 
      user: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: error.message });
  }
};


export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ erreur: "L'ancien et le nouveau mot de passe sont requis." });
    }

    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({ 
        erreur: "Mot de passe trop faible. Il doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole." 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ erreur: "Utilisateur non trouvé." });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ erreur: "Mot de passe actuel incorrect." });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(userId, { password: hash });

    res.status(200).json({ message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erreur: error.message });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Réponse générique pour éviter l'énumération d'emails
    const genericResponse = {
      message:
        "Si un compte existe avec cet email, vous allez recevoir un lien de réinitialisation.",
    };

    if (!email) {
      return res.status(400).json({ message: "Email requis." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // On envoie l'email uniquement si le compte existe
    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            resetPasswordTokenHash: resetTokenHash,
            resetPasswordExpiresAt: expiresAt,
          },
        }
      );

      // En dev, on veut souvent pointer vers localhost plutôt que le lien prod.
      // Priorité: FRONT_LINK_DEV -> FRONT_LINK
      const frontBaseUrl =
        process.env.FRONT_LINK_DEV || process.env.FRONT_LINK;

      if (!frontBaseUrl) {
        console.warn(
          "FRONT_LINK (ou FRONT_LINK_DEV) manquant: impossible de générer le lien de reset."
        );
      }

      const resetLink = `${frontBaseUrl}/reset-password/${resetToken}`;

      const emailHtml = `
        <h1>Réinitialisation de votre mot de passe</h1>
        <p>Bonjour ${user.prenom || ""},</p>
        <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous :</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #3F3F3F; color: white; text-decoration: none; border-radius: 5px; margin: 16px 0;">Réinitialiser mon mot de passe</a>
        <p>Ce lien expire dans 15 minutes.</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
        <p>L'équipe V.A. Productions</p>
      `;

      const emailText = `Réinitialisation de mot de passe : ${resetLink} (expire dans 15 minutes)`;

      await sendMail(
        normalizedEmail,
        "Réinitialisation de votre mot de passe V.A. Productions",
        emailHtml,
        emailText
      );
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Erreur requestPasswordReset:", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token et nouveau mot de passe requis." });
    }

    if (!isPasswordStrong(newPassword)) {
      return res.status(400).json({
        message:
          "Mot de passe trop faible. Il doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole.",
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Lien invalide ou expiré." });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await User.updateOne(
      { _id: user._id },
      {
        $set: { password: hash },
        $unset: { resetPasswordTokenHash: "", resetPasswordExpiresAt: "" },
      }
    );

    return res.status(200).json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    console.error("Erreur resetPassword:", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};