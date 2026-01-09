import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  nom: {
    type: String,
    required: true,
  },
  prenom: {
    type: String,
    required: true,
  },
  password: {
    type: String,
  },
  role: {
    type: String,
    required: true,
    default: "commercial",
  },
  creationDate: {
    type: Date,
    default: Date.now(),
  },
  verificationCode: {
    type: String,
  },

  // Mot de passe oublié
  resetPasswordTokenHash: {
    type: String,
  },
  resetPasswordExpiresAt: {
    type: Date,
  },
});

let User = mongoose.model("User", userSchema);

export default User;
