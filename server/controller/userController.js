import User from "../model/userModel.js";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
import { sendMail } from "../utils/sendMail.js";
import crypto from "crypto";

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
    const { nom, prenom, email } = req.body;

    if (!nom || !prenom || !email) {
      return res
        .status(400)
        .json({ erreur: "Nom, prénom et email sont requis." });
    }

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

    const user = await User.create({ nom, prenom, email, verificationCode });

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
      return res
        .status(400)
        .json({ message: "Les champs ne peuvent pas être vides" });
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
      return res.status(400).json({
        message:
          "Ce compte n'a pas encore été activé. Veuillez vérifier vos e-mails.",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    // Le mot de passe est invalide
    if (!match) {
      return res.status(400).json({ message: "Le mot de passe est incorrect" });
    }

    // mot de passe valide on crée le token et on connecte l'utilisateur
    const token = createToken(user);
    res
      .status(200)
      .json({ userId: user._id, username: user.username || user.email, token });
  } catch (error)
 {
    res.status(501).json({ error: error.message });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const { password, confirmationCode, email } = req.body;

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