import Order from "../model/orderModel.js";
import Invoice from "../model/invoiceModel.js";
import createOrderPdf, { createOrderPdfBuffer } from "../utils/orderCreator.js";
import { writeFile } from "fs";
import crypto from "crypto";
import path from "path";
import fs from "fs";

export const createOrder = async (req, res) => {
  try {
    const client = req.body.invoice.client;
    const tva = req.body.tva.percentage;
    const { orderNumber: maxOrderNumber = 0 } =
      (await Order.findOne().sort({ orderNumber: -1 })) || {};

    const randomImageName = crypto.randomBytes(32).toString("hex");

    saveSignature(req.body.invoice.client.signature, randomImageName);

    console.log(client);

    let total = client.support.reduce(
      (sum, item) => sum + (item.price || 0),
      0
    );
    total = Number(total) + Number(total * tva);

    const order = await Order.create({
      client: client.clientId,
      compagnyName: client.compagnyName,
      orderNumber: maxOrderNumber + 1,
      date: Date.now(),
      items: client.support,
      totalPrice: total,
      firstAddress: client.address1,
      secondAddress: client.address2,
      postalCode: client.postalCode,
      city: client.city,
      supportList: client.support,
      status: "Pending",
      signature: randomImageName,
      tva: tva,
    });
    await createOrderPdf(client, res, maxOrderNumber + 1, tva, randomImageName);
    //res.status(200).json({ order: order });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ orderNumber: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const getOrdersByEntreprise = async (req, res) => {
  try {
    const orders = await Order.find({
      entreprise: req.params.entreprise,
    }).sort({ orderNumber: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const generateOrder = async (req, res) => {
  try {
    const data = req.body;
    console.log("Generating order with data:", data);
    res.status(200).json({ message: "Order generated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const getOrderPdf = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("getOrderPdf appelé pour l'ID:", id);
    
    const order = await Order.findById(id);
    if (!order) {
      console.log("Commande introuvable pour l'ID:", id);
      return res.status(404).json({ error: "Commande introuvable" });
    }

    console.log("Commande trouvée:", order.orderNumber, order.compagnyName);

    // Construire l'objet client attendu par le générateur
    const clientForPdf = {
      compagnyName: order.compagnyName,
      address1: order.firstAddress,
      address2: order.secondAddress,
      postalCode: order.postalCode,
      city: order.city,
      support: (order.items || []).map((it) => ({
        name: it.name,
        supportName: it.supportName,
        supportNumber: it.supportNumber,
        price: it.price,
      })),
      signature: order.signature,
    };

    // Générer le PDF en mémoire (évite problèmes de fichiers sur hébergement éphémère)
    console.log("Génération du PDF en mémoire...");
    const pdfBuffer = await createOrderPdfBuffer(
      clientForPdf,
      order.orderNumber,
      order.tva || 0.2,
      order.signature
    );

    const filename = `commande-${order.orderNumber}.pdf`;
    console.log("PDF généré, envoi au client avec le nom:", filename);

    // Envoyer le PDF avec les en-têtes appropriés
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(filename)}"`);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.setHeader("Content-Length", pdfBuffer.length);
    
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    console.error("Erreur dans getOrderPdf:", error);
    return res.status(500).json({ error: "Erreur lors de la génération du PDF", details: error.message });
  }
};

const saveSignature = (signature, imageName) => {
  try {
    if (!signature) {
      console.log("Aucune signature fournie pour la commande — skip saveSignature");
      return;
    }

    const invoicesDir = path.resolve(process.cwd(), "invoices");
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
      console.log("Dossier invoices créé :", invoicesDir);
    }

    const base64Data = signature.replace(/^data:image\/png;base64,/, "");
    const filePath = path.join(invoicesDir, `${imageName}.png`);
    fs.writeFile(filePath, base64Data, "base64", function (err) {
      if (err) {
        console.error("Erreur en sauvegardant la signature :", err);
      } else {
        console.log("Signature sauvegardée :", filePath);
      }
    });
  } catch (e) {
    console.error("saveSignature exception :", e);
  }
};

export const validateOrder = async (req, res) => {
  const { orders } = req.body;
  for (const orderItem of orders) {
    const order = await Order.findByIdAndUpdate(orderItem._id, {
      status: "validated",
    });
    const { number: maxNumber = 0 } =
      (await Invoice.findOne().sort({ number: -1 })) || {};
    await Invoice.create({
      client: order.client,
      number: maxNumber + 1,
      date: Date.now(),
      entreprise: order.compagnyName,
      firstAddress: order.firstAddress,
      secondAddress: order.secondAddress,
      postalCode: order.postalCode,
      city: order.city,
      supportList: order.items,
      totalPrice: order.totalPrice,
    });
    res.status(200).json({ message: "Commande validée" });
  }
};

export const cancelOrder = async (req, res) => {
  const { orders } = req.body;
  for (const orderItem of orders) {
    const order = await Order.findByIdAndUpdate(orderItem._id, {
      status: "cancel",
    });
  }
  res.status(200).json({ message: "Commande annulée" });
};
