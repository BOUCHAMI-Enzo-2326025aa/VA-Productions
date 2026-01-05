import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import "dotenv/config";

import "./model/contactModel.js";
import "./model/userModel.js";
import "./model/orderModel.js";
import "./model/invoiceModel.js";
import "./model/eventModel.js";
import "./model/magazineModel.js";

import { router as userRouter } from "./routes/userRoute.js";
import { router as invoiceRouter } from "./routes/invoiceRoute.js";
import { router as contactRouter } from "./routes/contactRoute.js";
import { router as orderRouter } from "./routes/orderRoute.js";
import { router as magazineRouter } from "./routes/magazineRoute.js";
import eventRoutes from "./routes/eventRoutes.js";
import googleCalendarRouter from "./routes/googleCalendarRoute.js";
import chargeRouter from "./routes/chargeRoute.js";
import signatureRouter from "./routes/signatureRoute.js";
//import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.get("/invoices/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "invoices", filename);

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Erreur lors de l'envoi du fichier:", err);
      res.status(500).send("Erreur lors du téléchargement du fichier");
    }
  });
});

const allowedOrigins = [
  process.env.FRONT_LINK,    // L'URL de votre site en production
  'http://localhost:5173',   // L'URL de votre client en local
  'http://localhost:5174'    // J'ajoute l'autre port au cas où il changerait
];

app.use(cors({
  origin: function (origin, callback) {
    // autoriser les requêtes sans origine (comme Postman) ou si l'origine est dans la liste
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par la politique CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true, 
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir les images des magazines uploadées
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/user", userRouter);
app.use("/api/contact", contactRouter);
app.use("/api", eventRoutes);
app.use("/api/invoice", invoiceRouter);
app.use("/api/order", orderRouter);
app.use("/api/magazine", magazineRouter);
app.use("/api/google", googleCalendarRouter);
app.use("/api/charge", chargeRouter);
app.use("/api/signature", signatureRouter);


app.listen(process.env.PORT, () => {
  console.log(`App started on port ${process.env.PORT}`);
});


mongoose
  .connect(process.env.MONGODBURL)
  .then(() => {
    console.log("App connected to database");
  })
  .catch((error) => {
    console.log(error);
  });
