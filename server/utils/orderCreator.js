import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

function createOrderPdf(client, res, number, tva, randomImageName) {
  console.log("createOrderPdf called - number:", number, "tva:", tva, "randomImageName:", randomImageName);
  try {
    console.log("client.support:", JSON.stringify(client?.support));
  } catch (e) {
    console.log("Could not stringify client.support", e);
  }
  const invoicesDir = "./orders";
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir);
  }
  const fileName = `${number}_${
    client?.compagnyName?.toUpperCase() || "COMMANDE"
  }.pdf`;
  const filePath = path.join(invoicesDir, fileName);

  let doc = new PDFDocument({ margin: 50 });
  const writeStream = fs.createWriteStream(filePath);
  writeStream.on("error", (err) => {
    console.error("Erreur lors de l'écriture du fichier PDF :", err);
  });

  doc.pipe(writeStream);
  generateHeader(doc, client, number); // Ajoutez vos autres fonctions de génération de PDF ici
  generateInvoiceTable(doc, client, tva, randomImageName);
  doc.end();

  // Envoi du fichier une fois qu'il est généré
  writeStream.on("finish", () => {
    res.removeHeader("Content-Disposition");
    res.removeHeader("Content-Type");
    res.removeHeader("Cache-Control");

    // Définir manuellement les en-têtes avant d'envoyer le fichier
    // Utiliser 'inline' pour permettre l'affichage dans le navigateur (preview)
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(fileName)}"`
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    // Envoyer le fichier via res.download
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Erreur lors de l'envoi du fichier PDF :", err);
        res.status(500).send("Erreur lors de l'envoi du fichier PDF.");
      } else {
        console.log("Fichier envoyé avec succès :", fileName);
      }
    });
  });
}

function generateHeader(doc, client, number) {
  const currentDate = new Date();
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
      client?.compagnyName ? (client?.compagnyName).toUpperCase() : "-",
      50,
      210,
      {
        align: "left",
      }
    )
    .font("Helvetica")
    .text(client?.address1 ? client?.address1 : "-", 50, 225, {
      align: "left",
    })
    .text(client?.address2 ? client?.address2 : "-", 50, 235, {
      align: "left",
    })
    .text(client?.postalCode + " " + client?.city, 50, 245, {
      align: "left",
    })
    .font("Helvetica-Bold")
    .fontSize(25)
    .fillColor("#948a54")
    .text("BON DE COMMANDE", 200, 50, { align: "right" })
    .fillColor("black")
    .fontSize(10)
    .text("DATE : ", 400, 100)
    .font("Helvetica")
    .text(formattedDate, 480, 100)
    .font("Helvetica-Bold")
    .text("N° BON DE COMMANDE :", 400, 115)
    .text(number, 530, 115)
    .text("POUR :", 400, 170);
}

function generateInvoiceTable(doc, client, tva, randomImageName) {
  if (client?.support.length > 0) {
    let i;
    const invoiceTableTop = 300;

    doc.font("Helvetica-Bold");
    generateTableRow(
      doc,
      invoiceTableTop,
      "Encart",
      "Support",
      "Qté",
      "",
      "Montant"
    );
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");

    for (i = 0; i < client?.support.length; i++) {
      const item = client?.support[i];
      const position = invoiceTableTop + (i + 1) * 30;
      generateTableRow(
        doc,
        position,
        client?.support[i]?.name,
        client?.support[i]?.supportName,
        client?.support[i]?.supportNumber,
        formatPrice(client?.support[i]?.price),
        formatPrice(client?.support[i]?.price) + " €"
      );

      generateHr(doc, position + 20);
    }

    const subtotalPosition = invoiceTableTop + (i + 1) * 30;
    let subTotal = 0;
    for (i = 0; i < client?.support.length; i++) {
      subTotal = subTotal + parseFloat(client?.support[i]?.price || 0);
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
      formatPrice(subTotal * tva)
    );

    const totalPosition = tvaPosition + 20;
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
      .text(
        "Veuillez rédiger tous les chèques à l'ordre de V.A. PRODUCTIONS.",
        50,
        totalPosition + 50,
        { align: "left" }
      )
      .text(
        "Total dû dans un délai de 15 jours. Comptes en souffrance soumis à des frais de service de 1 % par mois.",
        50,
        totalPosition + 60,
        { align: "left" }
      )
      .font("Helvetica-Bold")
      .text("MERCI DE VOTRE CONFIANCE !", 50, totalPosition + 100, {
        align: "center",
      })
      .text("Signature", 100, totalPosition + 140);

    // Inclure la signature depuis la dataURI stockée en base (priorité) ou depuis le fichier PNG
    try {
      if (client.signatureData) {
        // Utilise la dataURI base64 directement depuis la base de données
        console.log("Utilisation de signatureData (dataURI) pour la signature");
        doc.image(client.signatureData, 50, totalPosition + 150, { width: 150 });
      } else if (randomImageName) {
        // Fallback: cherche le fichier PNG sur disque (pour compatibilité anciennes commandes)
        const imgPath = path.join(process.cwd(), "invoices", `${randomImageName}.png`);
        if (fs.existsSync(imgPath)) {
          console.log("Utilisation du fichier PNG pour la signature:", imgPath);
          doc.image(imgPath, 50, totalPosition + 150, { width: 150 });
        } else {
          console.log("Signature image introuvable, saut de l'inclusion de l'image:", imgPath);
        }
      } else {
        console.log("Aucune signature disponible (ni dataURI ni fichier)");
      }
    } catch (e) {
      console.log("Erreur lors de la vérification/inclusion de la signature :", e);
    }
  } else {
    doc
      .font("Helvetica")
      .text("Aucun support à facturer !", 50, 330, { align: "center" })
      .text(
        "Veuillez rédiger tous les chèques à l'ordre de V.A. PRODUCTIONS.",
        50,
        380,
        { align: "left" }
      )
      .text(
        "Total dû dans un délai de 15 jours. Comptes en souffrance soumis à des frais de service de 1 % par mois.",
        50,
        390,
        { align: "left" }
      )
      .font("Helvetica-Bold")
      .text("MERCI DE VOTRE CONFIANCE ! ", 50, 400, {
        align: "center",
      })
      .text("Signature", 100, 140);

    // Inclure la signature depuis la dataURI stockée en base (priorité) ou depuis le fichier PNG
    try {
      if (client.signatureData) {
        console.log("Utilisation de signatureData (dataURI) pour la signature (section vide)");
        doc.image(client.signatureData, 50, 450, { width: 150 });
      } else if (randomImageName) {
        const imgPath = path.join(process.cwd(), "invoices", `${randomImageName}.png`);
        if (fs.existsSync(imgPath)) {
          console.log("Utilisation du fichier PNG pour la signature (section vide):", imgPath);
          doc.image(imgPath, 50, 450, { width: 150 });
        } else {
          console.log("Signature image introuvable (section vide), saut de l'inclusion de l'image:", imgPath);
        }
      } else {
        console.log("Aucune signature disponible (section vide)");
      }
    } catch (e) {
      console.log("Erreur lors de la vérification/inclusion de la signature (section vide):", e);
    }
  }
}

function formatPrice(value) {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(value)
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

// Génère le PDF en mémoire et retourne un Buffer (utile pour hébergement sans système de fichiers persistant)
export function createOrderPdfBuffer(client, number, tva, randomImageName) {
  return new Promise((resolve, reject) => {
    try {
      console.log("createOrderPdfBuffer called - number:", number, "tva:", tva);
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const buffer = Buffer.concat(chunks);
        console.log("PDF buffer generated, size:", buffer.length);
        resolve(buffer);
      });
      doc.on("error", (err) => {
        console.error("Erreur lors de la génération du PDF buffer:", err);
        reject(err);
      });

      // Génération du contenu du PDF
      generateHeader(doc, client, number);
      generateInvoiceTable(doc, client, tva, randomImageName);
      doc.end();
    } catch (e) {
      console.error("Exception dans createOrderPdfBuffer:", e);
      reject(e);
    }
  });
}

export default createOrderPdf;
