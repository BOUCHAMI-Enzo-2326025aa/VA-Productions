import User from "../model/userModel.js";
import bcrypt from "bcrypt";
import jsonwebtoken from "jsonwebtoken";
// import { sendMail } from "../utils/sendMail.js";
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
    console.log("-> Début de la création d'utilisateur...");
    const { nom, prenom, email } = req.body;
    console.log("Données reçues :", { nom, prenom, email }); // LOG 1: Vérifier les données reçues

    if (!nom || !prenom || !email) {
      console.log("ERREUR: Données manquantes.");
      return res.status(400).json({ erreur: "Nom, prénom et email sont requis." });
    }

    const verificationCode = crypto.randomBytes(16).toString("hex");

    const newUser = { nom, prenom, email, verificationCode };
    console.log("Objet utilisateur prêt à être créé :", newUser); // LOG 2: Voir l'objet avant la création

    const user = await User.create(newUser);

    console.log("Utilisateur créé avec succès dans la DB :", user); // LOG 3: Voir le résultat de la création

    res.status(200).json({ user });
  } catch (error) {
    console.error("!!! ERREUR CATCHÉE DANS CREATEUSER !!!:", error); // LOG 4: Capturer toute erreur
    res.status(500).json({ erreur: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      throw new Error("Les champs ne peuvent pas être vides");

    const user = await User.findOne({
      $or: [{ username: username }, { email: username }],
    });

    // L'utilisateur n'existe pas
    if (!user) {
      res.status(400).json({ message: "Le login est incorrect" });
      return;
    }

    // L'utilisateur existe mais n'a pas encore défini de mot de passe
    if (!user.password) {
        return res.status(400).json({ message: "Ce compte n'a pas encore été activé. Veuillez vérifier vos e-mails." });
    }

    const match = await bcrypt.compare(password, user.password);

     // Le mot de passe est invalide
    if (!match) {
      return res.status(400).json({ message: "Le mot de passe est incorrect" });
    } 
    
    // mot de passe valide on crée le token et on connecte l'utilisateur
    const token = createToken(user);
    res.status(200).json({ userId: user._id, username: user.username || user.email, token });
  } catch (error) {
    res.status(501).json({ error: error.message });
  }
};

export const verifyUser = async (req, res) => {
  try {
    const { password, confirmationCode, email } = req.body;

    const user = await User({ verificationCode: confirmationCode, email });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    if (user) {
      const user = await User.updateOne({ email }, { password: hash });
      const userId = user._id;
      const token = createToken(user);
      res.status(200).json({ userId, user, token });
    } else {
      res.status(400).json({ message: "Code de vérification invalide" });
    }
  } catch (error) {
    console.log(error);
    res.status(501).json({ error: error.message });
  }
};
