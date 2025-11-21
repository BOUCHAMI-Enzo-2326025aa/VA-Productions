import mongoose from "mongoose";

const magazineSchema = new mongoose.Schema({
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
  type: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});


const Magazine = mongoose.model("Magazine", magazineSchema);

export default Magazine;