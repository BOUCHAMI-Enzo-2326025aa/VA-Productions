import Order from "../model/orderModel.js";
import Invoice from "../model/invoiceModel.js";
import createOrderPdf from "../utils/orderCreator.js";
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
    const order = await Order.findById(id);
    const expectedName = `${order.orderNumber}_${order.compagnyName.toUpperCase()}.pdf`;
    console.log("getOrderPdf called for order id:", id, "expecting file:", expectedName);
    const filePath = path.resolve(
      process.cwd(),
      `./orders/${order.orderNumber}_${order.compagnyName.toUpperCase()}.pdf`
    );
    const exists = fs.existsSync(filePath);
    console.log("PDF filePath:", filePath, "exists:", exists);
    if (exists) {
      try {
        const stats = fs.statSync(filePath);
        console.log("PDF file mtime:", stats.mtime);
      } catch (e) {
        console.log("Could not stat file:", e);
      }
    }
    // Regenerate PDF if missing or older than the order date
    let shouldRegenerate = false;
    if (!exists) shouldRegenerate = true;
    else {
      try {
        const stats = fs.statSync(filePath);
        if (order.date && stats.mtime < new Date(order.date)) {
          shouldRegenerate = true;
        }
      } catch (e) {
        console.log("Could not stat file for regeneration check:", e);
        shouldRegenerate = true;
      }
    }

    if (shouldRegenerate) {
      console.log("Regenerating PDF for order", order._id);
      // build client object expected by createOrderPdf
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

      // createOrderPdf will write the file and call res.download itself
      try {
        await createOrderPdf(clientForPdf, res, order.orderNumber, order.tva, order.signature);
        return;
      } catch (e) {
        console.error("Erreur lors de la régénération du PDF :", e);
        return res.status(500).json({ error: "Erreur lors de la régénération du PDF" });
      }
    }

    // Serve existing file
    res.setHeader("Content-Type", "application/pdf");
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Erreur lors de l'envoi du PDF :", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

const saveSignature = (signature, imageName) => {
  const base64Data = signature.replace(/^data:image\/png;base64,/, "");
  writeFile(`invoices/${imageName}.png`, base64Data, "base64", function (err) {
    console.log(err);
  });
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
