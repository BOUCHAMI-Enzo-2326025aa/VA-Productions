import mongoose, { Schema } from "mongoose";

const SupportSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  supportName: {
    type: String,
    required: true,
  },
});

const invoiceShema = new mongoose.Schema({
  client: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Contact'
  },
  entreprise: {
    type: String,
    required: true,
  },
  number: {
    type: Number,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
  },
  firstAddress: {
    type: String,
    required: true,
  },
  secondAddress: {
    type: String,
  },
  postalCode: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  supportList: {
    type: [SupportSchema],
    required: true,
  },
  status: {
    type: String,
    enum: ["paid", "unpaid", "progress"],
    default: 'unpaid',
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  tva:{
    type: Number,
    required: true,
    default: 0.2
  },
  delaisPaie: { 
    type: String,
    default: "comptant"
  },
  eInvoiceStatus: {
    type: String,
    enum: ['pending', 'processing', 'sent', 'rejected', 'validated'], 
    default: 'pending'
  },
  eInvoiceTransactionId: { 
    type: String, 
  }
});

let Invoice = mongoose.model("Facture", invoiceShema);

export default Invoice;
