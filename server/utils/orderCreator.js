import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const toNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/\s/g, "").replace(",", ".");
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

async function createOrderPdf(client, res, number, tva, signatureData = null, signatureFileName) {
  const invoicesDir = "./orders";
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir);
  }
  const fileName = `${number}_${client?.compagnyName?.toUpperCase() || "COMMANDE"}.pdf`;
  const filePath = path.join(invoicesDir, fileName);

  const doc = new PDFDocument({ margin: 50 });
  const writeStream = fs.createWriteStream(filePath);
  
  const streamFinished = new Promise((resolve, reject) => {
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });
  
  doc.pipe(writeStream);
  
  generateHeader(doc, client, number);
  generateInvoiceTable(doc, client, tva, signatureData, signatureFileName);
  doc.end();
  await streamFinished;

  if (res) {
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Erreur d'envoi PDF :", err);
        if (!res.headersSent) {
          res.status(500).send("Erreur lors de l'envoi du PDF.");
        }
      }
    });
  }
}

function generateHeader(doc, client, number) {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("fr-FR");

  const clientSiret = typeof client?.siret === "string" ? client.siret.trim() : "";
  const clientVat = typeof client?.numTVA === "string" ? client.numTVA.trim() : "";
  const shouldShowCompanyIds = Boolean(clientSiret && clientVat);

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
    .text(shouldShowCompanyIds ? `SIRET : ${clientSiret}` : "", 50, 260, {
      align: "left",
    })
    .text(shouldShowCompanyIds ? `N° TVA : ${clientVat}` : "", 50, 270, {
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

function generateInvoiceTable(doc, client, tva, signatureData, signatureFileName) {
  const invoiceTableTop = 330; 
  let currentPosition = invoiceTableTop;

  const supports = Array.isArray(client.support) ? client.support : [];
  const normalisedSupports = supports.map((item) => {
    const price = toNumber(item?.price);
    const rawNumber = item?.supportNumber ?? item?.number ?? item?.quantity ?? "";
    const supportNumber = typeof rawNumber === "string" && rawNumber.trim()
      ? rawNumber.trim()
      : Number.isFinite(Number(rawNumber))
      ? String(rawNumber)
      : "";
    const rawSupportName = item?.supportName || item?.support || item?.support_label || "";
    const rawName = item?.name || item?.encart || item?.description || "";
    const supportName = typeof rawSupportName === "string" && rawSupportName.trim() ? rawSupportName.trim() : "-";
    const name = typeof rawName === "string" && rawName.trim() ? rawName.trim() : "-";
    return {
      ...item,
      price,
      supportNumber,
      supportName,
      name,
    };
  });

  doc.font("Helvetica-Bold");
  generateTableRow(doc, currentPosition, "Encart", "Support", "N° support", "Montant");
  currentPosition += 15;
  generateHr(doc, currentPosition);
  currentPosition += 10;
  
  doc.font("Helvetica");
  const subTotalSupports = normalisedSupports.reduce((sum, item) => sum + item.price, 0);

  normalisedSupports.forEach(item => {
    generateTableRow(
      doc,
      currentPosition,
      item.name,
      item.supportName,
      item.supportNumber || "-",
      formatPrice(item.price) + " €"
    );
    currentPosition += 20;
  });
  generateHr(doc, currentPosition);
  currentPosition += 10;
  
  generateTableRow(doc, currentPosition, "", "", "SOUS-TOTAL (C.A.)", formatPrice(subTotalSupports) + " €");
  currentPosition += 25;

  const tvaRate = toNumber(tva);
  const tvaAmount = subTotalSupports * tvaRate;
  const totalTTC = subTotalSupports + tvaAmount;

  generateTableRow(doc, currentPosition, "", "", "T.V.A.", `${formatPrice(tvaAmount)} €`);
  currentPosition += 20;

  doc.font("Helvetica-Bold");
  generateTableRow(doc, currentPosition, "", "", "TOTAL À PAYER (TTC)", `${formatPrice(totalTTC)} €`);
  currentPosition += 40;

  let paymentTermsText = "Total dû à réception de la commande."; 
  if (client && client.delaisPaie) {
    if (client.delaisPaie.toLowerCase() === 'comptant') {
      paymentTermsText = "Total dû comptant à réception de la commande.";
    } else {
      paymentTermsText = `Total dû dans un délai de ${client.delaisPaie}.`;
    }
  }

  doc
    .font("Helvetica")
    .fontSize(9)
    .text("Veuillez rédiger tous les chèques à l'ordre de V.A. PRODUCTIONS.", 50, currentPosition)
    .text(paymentTermsText, 50, currentPosition + 12)
    .text("Comptes en souffrance soumis à des frais de service de 1 % par mois.", 50, currentPosition + 24);
  currentPosition += 50;
  
  doc.font("Helvetica-Bold").fontSize(12).text("MERCI DE VOTRE CONFIANCE !", 50, currentPosition, { align: "center" });
  currentPosition += 40;
  
  doc.text("Signature", 100, currentPosition);

  const signatureBuffer = getSignatureBuffer(signatureData, signatureFileName || client?.signature);
  if (signatureBuffer) {
    try {
      doc.image(signatureBuffer, 50, currentPosition + 15, { width: 150 });
    } catch (error) {
      console.error("Impossible d'intégrer la signature dans le PDF:", error);
    }
  }
}

function getSignatureBuffer(signatureData, fallbackFileName) {
  if (typeof signatureData === "string" && signatureData.trim()) {
    const cleaned = signatureData.startsWith("data:image")
      ? signatureData.split(",")[1]
      : signatureData;

    try {
      const buffer = Buffer.from(cleaned, "base64");
      if (buffer.length > 0) {
        return buffer;
      }
    } catch (error) {
      console.error("Signature base64 invalide:", error);
    }
  }

  if (typeof fallbackFileName === "string" && fallbackFileName.trim()) {
    const imgPath = path.join(process.cwd(), "invoices", `${fallbackFileName}.png`);
    if (fs.existsSync(imgPath)) {
      try {
        return fs.readFileSync(imgPath);
      } catch (error) {
        console.error("Impossible de lire la signature depuis le disque:", error);
      }
    }
  }

  return null;
}

function formatPrice(value) {
  const numericValue = Number(value || 0);
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(numericValue)
    .replace(/\s/g, "");
}

function generateTableRow(doc, y, c1, c2, c3, c4) {
  doc.fontSize(10)
    .text(c1, 50, y, { width: 150 })   
    .text(c2, 200, y, { width: 150 }) 
    .text(c3, 300, y, { width: 150, align: "right" }) 
    .text(c4, 450, y, { width: 100, align: "right" }); 
}

function generateHr(doc, y) {
  doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}

export function createOrderPdfBuffer(client, number, tva, signatureData = null, signatureFileName) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
      doc.on("error", (err) => reject(err));

      generateHeader(doc, client, number);
      generateInvoiceTable(doc, client, tva, signatureData, signatureFileName);
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

export default createOrderPdf;