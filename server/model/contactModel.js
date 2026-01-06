import mongoose from "mongoose";

const contactSchema = mongoose.Schema({
  company: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: false,
    trim: true,
  },
  surname: {
    type: String,
    required: false,
    trim: true,
  },
  email: {
    type: String,
    required: false,
  },
  phoneNumber: {
    type: String,
    required: false,
  },
  siret: {
    type: String,
    required: true,
    trim: true,
  },
  numTVA: {
    type: String,
    required: true,
    trim: true,
  },
  delaisPaie: {
    type: String,
    required: false,
    default: "comptant",
    trim: true,
  },
  comments: {
    type: String,
    required: false,
  },
  lastCall: {
    type: Date,
    required: false,
  },
  status: {
    type: String,
    enum: ["PROSPECT", "CLIENT"],
  },
  createDate: {
    type: Date,
    required: false,
    default: Date(),
  },
});

let Contact = mongoose.model("Contact", contactSchema);

export default Contact;
