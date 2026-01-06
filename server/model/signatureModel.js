import mongoose from "mongoose";

const signatureSchema = new mongoose.Schema({
  signatureData: {
    type: String, // Base64 de l'image
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware pour mettre à jour updatedAt
signatureSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Signature = mongoose.model("Signature", signatureSchema);

export default Signature;
