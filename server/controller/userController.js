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
    const { nom, prenom, email } = req.body;

    const verificationCode = crypto.randomBytes(16).toString("hex");
    sendMail(
      email,
      "Vérification de votre compte",
      "Pour valider votre compte, veuillez cliquer sur le lien suivant: " +
        process.env.FRONT_LINK +
        "/user/verify/" +
        email +
        "/" +
        verificationCode
    );
    const user = await User.create({ nom, prenom, email, verificationCode });
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ erreur: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      throw new Error("Les champs ne peuvent pas être vides");

    const user = await User.findOne({ username: username });

    // L'utilisateur n'existe pas
    if (!user) {
      res.status(400).json({ message: "Le login est incorrect" });
      return;
    }

    const match = await bcrypt.compare(password, user.password);

    // Le mot de passe est invalide
    if (!match) {
      res.status(400).json({ message: "Le mot de passe est incorrect" });
      return;

      // Mot de passe valide
    } else {
      const userId = user._id;
      const token = createToken(user);
      res.status(200).json({ userId, username, token });
    }
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
