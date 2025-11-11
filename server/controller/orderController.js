import Order from "../model/orderModel.js";
import Invoice from "../model/invoiceModel.js";
import createOrderPdf, { createOrderPdfBuffer } from "../utils/orderCreator.js";
import { writeFile } from "fs";
import crypto from "crypto";
import path from "path";
import fs from "fs";

const toNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/\s/g, "").replace(",", ".");
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normaliseSupports = (supports = []) =>
  Array.isArray(supports)
    ? supports.map((item) => ({ ...item, price: toNumber(item?.price) }))
    : [];

const withComputedTotal = (orderDoc) => {
  const order = typeof orderDoc.toObject === "function" ? orderDoc.toObject() : orderDoc;
  const items = normaliseSupports(order.items);
  const supportList = normaliseSupports(order.supportList);
  const source = items.length ? items : supportList;
  const tvaRate = toNumber(order.tva);
  const baseTotal = source.reduce((sum, item) => sum + item.price, 0);
  const computed = Math.round(baseTotal * (1 + tvaRate) * 100) / 100;
  const stored = toNumber(order.totalPrice);
  return { ...order, items, supportList, tva: tvaRate, totalPrice: computed || stored };
};

export const createOrder = async (req, res) => {
  try {
    const client = req.body.invoice.client;
    const tva = req.body.tva.percentage;
    const { orderNumber: maxOrderNumber = 0 } = (await Order.findOne().sort({ orderNumber: -1 })) || {};

    const randomImageName = crypto.randomBytes(32).toString("hex");
    saveSignature(req.body.invoice.client.signature, randomImageName);

    const supports = normaliseSupports(client.support);
    const tvaRate = toNumber(tva);
    const baseTotal = supports.reduce((sum, item) => sum + item.price, 0);
    const total = Math.round(baseTotal * (1 + tvaRate) * 100) / 100;

    const order = await Order.create({
      client: client.clientId,
      compagnyName: client.compagnyName,
      orderNumber: maxOrderNumber + 1,
      date: Date.now(),
      items: supports,
      totalPrice: total,
      firstAddress: client.address1,
      secondAddress: client.address2,
      postalCode: client.postalCode,
      city: client.city,
      status: "pending",
      signature: randomImageName,
      signatureData: req.body.invoice.client.signature,
      tva: tvaRate,
      costs: client.costs || [], 
    });
    
    await createOrderPdf({ ...client, support: supports, costs: client.costs }, res, maxOrderNumber + 1, tvaRate, randomImageName);
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ orderNumber: -1 });
    res.status(200).json(orders.map(withComputedTotal));
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
    res.status(200).json(orders.map(withComputedTotal));
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

    const items = normaliseSupports(order.items);
    const rate = toNumber(order.tva || 0.2);

    // Construire l'objet client attendu par le générateur
    const clientForPdf = {
      compagnyName: order.compagnyName,
      address1: order.firstAddress,
      address2: order.secondAddress,
      postalCode: order.postalCode,
      city: order.city,
      support: items,
      signature: order.signature,
      signatureData: order.signatureData, 
    };

    console.log("Génération du PDF en mémoire...");
    const pdfBuffer = await createOrderPdfBuffer(
      clientForPdf,
      order.orderNumber,
      rate,
      order.signature
    );

    const filename = `commande-${order.orderNumber}.pdf`;
    console.log("PDF généré, envoi au client avec le nom:", filename);

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
  try {
    for (const orderItem of orders) {
      const order = await Order.findById(orderItem._id);
      if (!order) continue;
      
      order.status = "validated";
      await order.save();

      const { number: maxNumber = 0 } = (await Invoice.findOne().sort({ number: -1 })) || {};
      
      await Invoice.create({
        client: order.client,
        number: maxNumber + 1,
        date: new Date(),
        entreprise: order.compagnyName,
        firstAddress: order.firstAddress,
        secondAddress: order.secondAddress,
        postalCode: order.postalCode,
        city: order.city,
        supportList: order.items,
        totalPrice: order.totalPrice,
        tva: order.tva,
        costs: order.costs || [], 
      });
    }
    res.status(200).json({ message: "Commandes validées et factures créées." });
  } catch(error) {
    console.error("Erreur validation commande:", error);
    res.status(500).json({ error: "Erreur validation." });
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