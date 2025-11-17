import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import Contact from "../model/contactModel.js";

async function createInvoice(facture, res, number, tva = 0.2) {
  const invoicesDir = "./invoices";

  // Crée le répertoire s'il n'existe pas
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir);
  }

  const fileName = `${number}_${
    facture?.entreprise?.toUpperCase() || "facture"}.pdf`;
  const filePath = path.join(invoicesDir, fileName);

  const doc = new PDFDocument({ margin: 50 });

  // Crée un flux d'écriture et le transforme en Promise
  const writeStream = fs.createWriteStream(filePath);
  const streamFinished = new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  doc.pipe(writeStream);

  // Génération du contenu du PDF
  generateHeader(doc, facture, number);
  generateInvoiceTable(doc, facture, tva);

  doc.end();
  await streamFinished;

  if (res) {
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Erreur lors de l'envoi du fichier PDF :", err);
        if (!res.headersSent) {
          res.status(500).send("Erreur lors de l'envoi du fichier PDF.");
        }
      } else {
        console.log("Fichier envoyé avec succès :", fileName);
      }
    });
  } else {
    console.log(`Fichier PDF de facture généré et sauvegardé : ${fileName}`);
  }
}

function generateHeader(doc, facture, number) {
  const currentDate = new Date(facture.date);
  const formattedDate = currentDate.toLocaleDateString("fr-FR");
  doc
    .image("assets/Logo VA.jpg", 50, 50, { width: 150 })
    .font("Helvetica")
    .fontSize(10)
    .text("130 rue du Vallon de la Vierge bât. C", 50, 100, { align: "left" })
    .text("La Duranne", 50, 110, { align: "left" })
    .text("13100 AIX-EN-PROVENCE", 50, 120, { align: "left" })
    .text(
      "Téléphone : 04 42 53 10 22 / E-Mail : direction@vaproductions.fr",
      50,
      140,
      { align: "left" }
    )
    .text("RCS : 442 242 763 ", 50, 160, { align: "left" })
    .text("TVA Intracommunautaire : FR 18443242763", 50, 170, {
      align: "left",
    })
    .font("Helvetica-Bold")
    .text("CLIENT", 50, 190, {
      align: "left",
    })
    .text(
      facture?.entreprise ? (facture?.entreprise).toUpperCase() : "-",
      50,
      210,
      {
        align: "left",
      }
    )
    .font("Helvetica")
    .text(facture?.firstAddress ? facture?.firstAddress : "-", 50, 225, {
      align: "left",
    })
    .text(facture?.secondAddress ? facture?.secondAddress : "-", 50, 235, {
      align: "left",
    })
    .text(facture?.postalCode + " " + facture?.city, 50, 245, {
      align: "left",
    })
    .font("Helvetica-Bold")
    .fontSize(25)
    .fillColor("#948a54")
    .text("FACTURE", 200, 50, { align: "right" })
    .fillColor("black")
    .fontSize(10)
    .text("DATE : ", 400, 100)
    .font("Helvetica")
    .text(formattedDate, 480, 100)
    .font("Helvetica-Bold")
    .text("N° FACTURE :", 400, 115)
    .text(number, 480, 115)
    .text("POUR :", 400, 170);
}

function generateInvoiceTable(doc, facture, tva) {
  if (facture?.supportList.length > 0) {
    let i;
    const invoiceTableTop = 300;

    doc.font("Helvetica-Bold");
    // Colonnes: Encart / Support / N° support / Prix Unitaire / Montant
    generateTableRow(
      doc,
      invoiceTableTop,
      "Encart",
      "Support",
      "N° support",
      "PU",
      "Montant"
    );
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    for (i = 0; i < facture?.supportList.length; i++) {
      const item = facture?.supportList[i] || {};
      const position = invoiceTableTop + (i + 1) * 30;
    // le numéro peut provenir de supportNumber (depuis les commandes) ou de quantity si fournie
      const qty = Number(item.supportNumber ?? item.quantity ?? 1);
      const unitPrice = Number(item.price ?? 0);
      const lineTotal = unitPrice * qty;

      generateTableRow(
        doc,
        position,
        item.name || "",
        item.supportName || "",
        qty.toString(),
        formatPrice(unitPrice) + " €",
        formatPrice(lineTotal) + " €"
      );

      generateHr(doc, position + 20);
    }

    const subtotalPosition = invoiceTableTop + (i + 1) * 30;
    let subTotal = 0;
    for (i = 0; i < facture?.supportList.length; i++) {
      const it = facture.supportList[i] || {};
      const qty = Number(it.supportNumber ?? it.quantity ?? 1);
      const unit = Number(it.price ?? 0);
      subTotal += qty * unit;
    }
    const total = subTotal + subTotal * tva;
    generateTableRow(
      doc,
      subtotalPosition,
      "",
      "",
      "",
      "SOUS-TOTAL",
      formatPrice(parseFloat(subTotal)) + " €"
    );

    const tvaPercentPosition = subtotalPosition + 20;
    generateTableRow(
      doc,
      tvaPercentPosition,
      "",
      "",
      "",
      "TAUX DE T.V.A.",
      tva * 100 + "%"
    );

    const tvaPosition = tvaPercentPosition + 20;
    generateTableRow(
      doc,
      tvaPosition,
      "",
      "",
      "",
      "T.V.A.",
      formatPrice(subTotal * tva) + " €"
    );

    const totalPosition = tvaPosition + 20;

     let paymentTermsText = "Total dû à réception de la facture.";
    if (facture && facture.delaisPaie) {
      if (facture.delaisPaie.toLowerCase() === 'comptant') {
        paymentTermsText = "Total dû comptant à réception de la facture.";
      } else {
        paymentTermsText = `Total dû dans un délai de ${facture.delaisPaie}.`;
      }
    }
    
    doc.font("Helvetica-Bold");
    generateTableRow(
      doc,
      totalPosition,
      "",
      "",
      "",
      "TOTAL",
      formatPrice(total) + " €"
    );

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(
        "Veuillez rédiger tous les chèques à l'ordre de V.A. PRODUCTIONS.",
        50,
        totalPosition + 50,
        { align: "left" }
      )
      .text(paymentTermsText, 50, totalPosition + 65, { align: "left" })
      .text(
        "Comptes en souffrance soumis à des frais de service de 1 % par mois.",
        50,
        totalPosition + 80,
        { align: "left" }
      )
      .font("Helvetica-Bold")
      .text("MERCI DE VOTRE CONFIANCE !", 50, totalPosition + 110, {
        align: "center",
      });
  } else {
     let paymentTermsText = "Total dû dans un délai de 15 jours."; 
    if (contact && contact.delaisPaie) {
      if (contact.delaisPaie.toLowerCase() === 'comptant') {
        paymentTermsText = "Total dû comptant à réception de la facture.";
      } else {
        paymentTermsText = `Total dû dans un délai de ${contact.delaisPaie}.`;
      }
    }

    doc
      .font("Helvetica")
      .text("Aucun support à facturer !", 50, 330, { align: "center" })
      .text(
        "Veuillez rédiger tous les chèques à l'ordre de V.A. PRODUCTIONS.",
        50,
        380,
        { align: "left" }
      )
      .text(paymentTermsText, 50, 390, { align: "left" })
      .text("Comptes en souffrance soumis à des frais de service de 1 % par mois.", 50, 400, { align: "left" })
      .font("Helvetica-Bold")
      .text("MERCI DE VOTRE CONFIANCE ! ", 50, 420, {
        align: "center",
      });
  }
}

function formatPrice(value) {
  // Arrondir au centième pour éviter les erreurs de précision en virgule flottante
  const numericValue = Number(value ?? 0);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const rounded = Math.round((safeValue + Number.EPSILON) * 100) / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(rounded)
    .replace(/\s/g, "\u00A0");
}

function generateTableRow(doc, y, c1, c2, c3, c4, c5) {
  doc
    .fontSize(10)
    .text(c1, 50, y)
    .text(c2, 150, y)
    .text(c3, 280, y, { width: 90, align: "right" })
    .text(c4, 370, y, { width: 90, align: "right" })
    .text(c5, 0, y, { align: "right" });
}

function generateHr(doc, y) {
  doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}

export default createInvoice;
