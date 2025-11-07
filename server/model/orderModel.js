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
    ref: "Client",
  },
  compagnyName  : {
    type: String,
    required: true,
  },
  orderNumber: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  items: {
    type: [OrderItemSchema],
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
    enum: ["Pending", "Completed", "Cancelled"],
    default: "Pending",
  },
  tva: {
    type: Number,
    required: true,
    default: 0.2,
  }
  
});

const Order = mongoose.model("Order", OrderSchema);

export default Order;
