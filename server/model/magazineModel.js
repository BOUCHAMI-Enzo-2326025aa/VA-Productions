import mongoose from "mongoose";

const magazineSchema = mongoose.Schema({
  nom: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  image: {
    type: String,
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

// Middleware pour mettre à jour automatiquement updatedAt avant chaque modification
magazineSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Magazine = mongoose.model("Magazine", magazineSchema);

export default Magazine;
