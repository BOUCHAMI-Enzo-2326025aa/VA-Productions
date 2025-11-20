import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import "dotenv/config";

import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";

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

// Sécurité des en-têtes
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // pour afficher les images uploadées
}));

const whitelist = [
  "http://localhost:5173", 
  process.env.FRONT_LINK   
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("Bloqué par CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 250,
  message: "Trop de requêtes depuis cette IP, veuillez réessayer plus tard."
});
app.use("/api", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(mongoSanitize()); // Contre injection NoSQL
app.use(xss()); // Contre injection XSS
app.use(hpp()); 

mongoose
  .connect(process.env.MONGODBURL)
  .then(() => {
    console.log("App connected to database");
  })
  .catch((error) => {
    console.log(error);
  });


// Route spécifique pour les factures 
app.get("/invoices/:filename", (req, res) => {
  const filename = path.basename(req.params.filename); 
  const filePath = path.join(__dirname, "invoices", filename);

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Erreur envoi fichier:", err);
      res.status(err.status || 500).send("Fichier introuvable");
    }
  });
});

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`App started on port ${PORT}`);
});


