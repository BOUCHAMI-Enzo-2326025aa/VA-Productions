import mongoose, { Schema } from "mongoose";

const OrderItemSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  supportNumber: {
    type: Number,
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

const OrderSchema = new Schema({
  client: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Contact",
  },
  compagnyName  : {
    type: String,
    required: true,
  },
  orderNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  items: {
    type: [OrderItemSchema],
    required: true,
  },
  supportList: {
    type: [OrderItemSchema],
    default: undefined,
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
  totalPrice: {
    type: Number,
    required: true,
  },
  signature: {
    type: String,
    required: false,
  },
  signatureData: {
    type: String, // Stocke la dataURI complète base64 de la signature
    required: false,
  },
  status: {
    type: String,
    enum: ["pending", "validated", "cancel"], 
    default: "pending",
  },
  tva: {
    type: Number,
    required: true,
    default: 0.2,
  },
  delaisPaie: { 
    type: String,
    default: "comptant",
  }
});

const Order = mongoose.model("Order", OrderSchema);

export default Order;
