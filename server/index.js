import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import "dotenv/config";
import { router as userRouter } from "./routes/userRoute.js";
import { router as invoiceRouter } from "./routes/invoiceRoute.js";
import { router as contactRouter } from "./routes/contactRoute.js";
import { router as orderRouter } from "./routes/orderRoute.js";
import { router as magazineRouter } from "./routes/magazineRoute.js";
import eventRoutes from "./routes/eventRoutes.js";
import googleCalendarRouter from "./routes/googleCalendarRoute.js";
import chargeRouter from "./routes/chargeRoute.js";
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

app.use(cors({
  origin: process.env.FRONT_LINK,
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
