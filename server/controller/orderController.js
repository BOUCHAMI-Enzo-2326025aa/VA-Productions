import Order from "../model/orderModel.js";
import Invoice from "../model/invoiceModel.js";
import Contact from "../model/contactModel.js";
import createOrderPdf, { createOrderPdfBuffer } from "../utils/orderCreator.js";
import createInvoice from "../utils/invoiceCreator.js";
import Signature from "../model/signatureModel.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import multer from "multer";

const SIGNED_ORDER_DIR = path.join(process.cwd(), "uploads", "orders");
if (!fs.existsSync(SIGNED_ORDER_DIR)) {
  fs.mkdirSync(SIGNED_ORDER_DIR, { recursive: true });
}

const signedPdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, SIGNED_ORDER_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".pdf";
    cb(null, `order-${req.params.id}-signed${ext}`);
  },
});

const uploadSignedPdf = multer({
  storage: signedPdfStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Seuls les fichiers PDF sont acceptés."));
    }
    cb(null, true);
  },
}).single("file");

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
    ? supports.map((item) => {
        const price = toNumber(item?.price);
        const rawQuantity = item?.supportNumber ?? item?.quantity ?? 1;
        const supportNumber = Number.isFinite(Number(rawQuantity))
          ? Number(rawQuantity)
          : 1;
        const rawSupportName = item?.supportName || item?.support || item?.support_label || "";
        const rawName = item?.name || item?.encart || item?.description || "";
        const supportName =
          typeof rawSupportName === "string" && rawSupportName.trim()
            ? rawSupportName.trim()
            : "-";
        const name =
          typeof rawName === "string" && rawName.trim() ? rawName.trim() : "-";
        return {
          ...item,
          price,
          supportNumber,
          supportName,
          name,
        };
      })
    : [];

const isOrderSignedForInvoicing = (order) => {
  const hasSignatureData =
    typeof order?.signatureData === "string" && order.signatureData.trim().length > 0;
  const hasSignedPdfPath =
    typeof order?.signedPdfPath === "string" && order.signedPdfPath.trim().length > 0;

  if (order?.signLater === true) {
    return hasSignatureData || hasSignedPdfPath;
  }

  return true;
};

const withComputedTotal = (orderDoc) => {
  const order = typeof orderDoc.toObject === "function" ? orderDoc.toObject() : orderDoc;
  const items = normaliseSupports(order.items);
  const supportList = normaliseSupports(order.supportList);
  const source = items.length ? items : supportList;
  const tvaRate = toNumber(order.tva);
  const baseTotal = source.reduce((sum, item) => sum + item.price, 0);
  const computed = Math.round(baseTotal * (1 + tvaRate) * 100) / 100;
  const stored = toNumber(order.totalPrice);
  const hasSignatureData =
    typeof order.signatureData === "string" && order.signatureData.trim().length > 0;
  const hasSignedPdfPath =
    typeof order.signedPdfPath === "string" && order.signedPdfPath.trim().length > 0;
  const inferredSigned =
    order.signLater === true
      ? hasSignatureData || hasSignedPdfPath
      : true;
  return {
    ...order,
    items,
    supportList,
    tva: tvaRate,
    totalPrice: computed || stored,
    isSigned: inferredSigned,
  };
};

export const createOrder = async (req, res) => {
  try {
    const client = req.body?.invoice?.client || {};
    const tva = req.body?.tva?.percentage;
    const { orderNumber: maxOrderNumber = 0 } = (await Order.findOne().sort({ orderNumber: -1 })) || {};

    const signLater = !!client?.signLater;
    const signatureDataRaw = client?.signatureData || client?.signature;
    const signatureData =
      typeof signatureDataRaw === "string" && signatureDataRaw.trim() ? signatureDataRaw.trim() : null;

    if (!signLater && !signatureData) {
      return res.status(400).json({
        error: "Signature client manquante. Veuillez signer avant de créer le bon de commande.",
      });
    }

    let finalDelaisPaie = client.delaisPaie;
    if (client.delaisPaie === "autre") {
      const days = (client.customDelaisDays || "").trim();
      const suffix = (client.customDelaisSuffix || "").trim();
      if (days) {
        finalDelaisPaie = `${days} jours${suffix ? ` ${suffix}` : ""}`;
      } else {
        finalDelaisPaie = "comptant";
      }
    }

    const supports = normaliseSupports(client.support);
    const tvaRate = toNumber(tva);
    const baseTotal = supports.reduce((sum, item) => sum + item.price, 0);
    const total = Math.round(baseTotal * (1 + tvaRate) * 100) / 100;

    const orderNumber = maxOrderNumber + 1;

    let clientIdRaw = typeof client?.clientId === "string" ? client.clientId.trim() : "";
    const hasValidClientId = clientIdRaw && mongoose.Types.ObjectId.isValid(clientIdRaw);

    // Si aucun contact existant n’est sélectionné, on crée un nouveau contact
    // pour que la commande soit bien sauvegardée et visible dans la liste.
    if (!hasValidClientId) {
      const company = typeof client?.compagnyName === "string" ? client.compagnyName.trim() : "";
      if (!company) {
        return res.status(400).json({ error: "Entreprise manquante pour créer le contact." });
      }

      const createdContact = await Contact.create({
        company,
        name: typeof client?.name === "string" ? client.name.trim() : "",
        surname: typeof client?.surname === "string" ? client.surname.trim() : "",
        email: typeof client?.email === "string" ? client.email.trim() : "",
        phoneNumber: typeof client?.phone === "string" ? client.phone.trim() : "",
        siret: typeof client?.siret === "string" ? client.siret.trim() : "",
        numTVA: typeof client?.numTVA === "string" ? client.numTVA.trim() : "",
        delaisPaie: finalDelaisPaie,
      });

      clientIdRaw = String(createdContact._id);
    }

    await Order.create({
      client: clientIdRaw,
      compagnyName: client.compagnyName,
      orderNumber,
      date: Date.now(),
      items: supports,
      totalPrice: total,
      supportList: supports,
      firstAddress: client.address1 || "",
      secondAddress: client.address2 || "",
      postalCode: client.postalCode || "",
      city: client.city || "",
      status: "pending",
      tva: tvaRate,
      delaisPaie: finalDelaisPaie,
      signatureData: signLater ? null : signatureData,
      signLater,
      isSigned: !signLater && !!signatureData,
      signedPdfPath: null,
    });

    const contact = await Contact.findById(clientIdRaw);
    
    await createOrderPdf(
      {
        ...client,
        support: supports,
        delaisPaie: finalDelaisPaie,
        siret: contact?.siret,
        numTVA: contact?.numTVA,
      },
      res,
      orderNumber,
      tvaRate,
      signLater ? null : signatureData
    );
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

export const uploadSignedOrderPdf = (req, res) => {
  uploadSignedPdf(req, res, async (err) => {
    if (err) {
      console.error("Erreur upload PDF signé:", err);
      return res.status(400).json({ error: err.message || "Erreur upload" });
    }

    try {
      const { id } = req.params;
      if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier reçu." });
      }

      const relativePath = path.join("uploads", "orders", req.file.filename);

      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        {
          $set: {
            signedPdfPath: relativePath,
            isSigned: true,
          },
        },
        { new: true }
      );

      if (!updatedOrder) {
        return res.status(404).json({ error: "Commande introuvable." });
      }

      return res
        .status(200)
        .json({ message: "Bon signé enregistré.", order: withComputedTotal(updatedOrder) });
    } catch (e) {
      console.error("Erreur en sauvegardant le bon signé:", e);
      return res.status(500).json({ error: "Erreur lors de l'enregistrement du bon signé." });
    }
  });
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

    if (typeof order.signedPdfPath === "string" && order.signedPdfPath.trim()) {
      const absolutePdfPath = path.resolve(process.cwd(), order.signedPdfPath);
      if (fs.existsSync(absolutePdfPath)) {
        const filename = `commande-${order.orderNumber}-signee.pdf`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${encodeURIComponent(filename)}"`
        );
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
        return fs.createReadStream(absolutePdfPath).pipe(res);
      }
    }

    const items = normaliseSupports(order.items);
    const rate = toNumber(order.tva || 0.2);

    const contact = await Contact.findById(order.client);

    let signatureData = order.signatureData || null;
    if (!signatureData && order.signLater !== true) {
      const latestSignature = await Signature.findOne().sort({ updatedAt: -1 });
      signatureData = latestSignature?.signatureData || null;
    }

    const clientForPdf = {
      compagnyName: order.compagnyName,
      address1: order.firstAddress,
      address2: order.secondAddress,
      postalCode: order.postalCode,
      city: order.city,
      support: items,
      signatureData,
      delaisPaie: order.delaisPaie,
      siret: contact?.siret,
      numTVA: contact?.numTVA,
    };

    console.log("Génération du PDF en mémoire...");
    const pdfBuffer = await createOrderPdfBuffer(
      clientForPdf,
      order.orderNumber,
      rate,
      signatureData,
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

export const validateOrder = async (req, res) => {
  const { orders } = req.body;
  try {
    const createdInvoices = [];
    const blockedOrders = [];
    const lastInvoice = await Invoice.findOne().sort({ number: -1 });
    let currentInvoiceNumber = lastInvoice ? lastInvoice.number : 0;

    const orderDatas = [];
    for (const orderItem of orders) {
      const orderData = await Order.findById(orderItem._id).populate({
        path: "client",
        model: "Contact",
      });

      if (!orderData) {
        console.warn(
          `Commande ${orderItem._id} ou contact associé introuvable, ignorée.`
        );
        continue;
      }

      if (!isOrderSignedForInvoicing(orderData)) {
        blockedOrders.push({
          _id: orderData._id,
          orderNumber: orderData.orderNumber,
          compagnyName: orderData.compagnyName,
        });
        continue;
      }

      orderDatas.push(orderData);
    }

    if (blockedOrders.length > 0) {
      return res.status(400).json({
        error:
          "Certaines commandes ne sont pas signées. Veuillez ajouter le bon signé avant de les mettre en facturation.",
        blockedOrders,
      });
    }

    for (const orderData of orderDatas) {
      
      currentInvoiceNumber++;

      const newInvoice = new Invoice({
        client: orderData.client ? orderData.client._id : orderData.client,
        number: currentInvoiceNumber,
        date: orderData.date,
        entreprise: orderData.compagnyName,
        firstAddress: orderData.firstAddress,
        secondAddress: orderData.secondAddress,
        postalCode: orderData.postalCode,
        city: orderData.city,
        supportList: orderData.items,
        totalPrice: orderData.totalPrice,
        tva: orderData.tva,
        status: "unpaid",
        delaisPaie: orderData.delaisPaie,
      });
      
      await newInvoice.save();
      createdInvoices.push(newInvoice);

      await Order.findByIdAndUpdate(orderData._id, { status: "validated" });
      
      const pdfData = {
        ...newInvoice.toObject(),
        delaisPaie: orderData.delaisPaie
      };

      createInvoice(pdfData, null, newInvoice.number, newInvoice.tva)
        .catch(err => console.error(`Erreur lors de la génération du PDF pour la facture ${newInvoice.number}:`, err));
    }
    
    res.status(200).json({ 
      message: `${createdInvoices.length} commande(s) validée(s) et facture(s) créée(s).`,
      invoices: createdInvoices
    });

  } catch(error) {
    console.error("Erreur validation commande:", error);
    res.status(500).json({ error: "Erreur lors de la validation des commandes." });
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

// Mise à jour d'une commande
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      compagnyName,
      firstAddress,
      secondAddress,
      postalCode,
      city,
      items = [],
      tva,
      status,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "La commande doit contenir au moins un support." });
    }

    const sanitizedItems = items.map((item) => {
      const rawQuantity = item?.supportNumber ?? item?.quantity ?? 1;
      const supportNumber = Number.isFinite(Number(rawQuantity)) ? Number(rawQuantity) : 0;
      const name =
        typeof item?.name === "string" && item.name.trim()
          ? item.name.trim()
          : typeof item?.encart === "string" && item.encart.trim()
          ? item.encart.trim()
          : "";
      const supportName =
        typeof item?.supportName === "string" && item.supportName.trim()
          ? item.supportName.trim()
          : typeof item?.support === "string" && item.support.trim()
          ? item.support.trim()
          : "";
      return {
        name,
        supportName,
        supportNumber,
        price: toNumber(item?.price),
      };
    });

    if (sanitizedItems.some((item) => !item.name || !item.supportName)) {
      return res
        .status(400)
        .json({ error: "Chaque support doit contenir un encart et un support." });
    }

    if (sanitizedItems.some((item) => item.supportNumber < 0)) {
      return res
        .status(400)
        .json({ error: "Le numéro du support ne peut pas être négatif." });
    }

    if (sanitizedItems.some((item) => !Number.isFinite(item.price) || item.price < 0)) {
      return res
        .status(400)
        .json({ error: "Le prix de chaque support doit être un nombre positif." });
    }

    const rate = toNumber(tva ?? 0);
    if (!Number.isFinite(rate) || rate < 0) {
      return res.status(400).json({ error: "Le taux de TVA est invalide." });
    }

    const baseTotal = sanitizedItems.reduce((sum, item) => sum + item.price, 0);
    const totalPrice = Math.round(baseTotal * (1 + rate) * 100) / 100;

    const updatePayload = {
      items: sanitizedItems,
      totalPrice,
      tva: rate,
      supportList: sanitizedItems,
    };

    if (compagnyName !== undefined) updatePayload.compagnyName = compagnyName;
    if (firstAddress !== undefined) updatePayload.firstAddress = firstAddress;
    if (secondAddress !== undefined) updatePayload.secondAddress = secondAddress;
    if (postalCode !== undefined) updatePayload.postalCode = postalCode;
    if (city !== undefined) updatePayload.city = city;
    if (typeof status === "string") updatePayload.status = status;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Commande introuvable." });
    }

    return res.status(200).json({ order: withComputedTotal(updatedOrder) });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la commande:", error);
    return res.status(500).json({ error: "Erreur lors de la mise à jour de la commande." });
  }
};