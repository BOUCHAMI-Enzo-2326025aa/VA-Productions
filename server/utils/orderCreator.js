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
  
  const tableTop = generateHeader(doc, client, number, tva);
  generateInvoiceTable(doc, client, tva, signatureData, signatureFileName, tableTop);
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

function formatPercent(value) {
  const numericValue = Number(value || 0);
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(numericValue)
    .replace(/\s/g, "");
}

function parsePaymentDelayDays(delaisPaie) {
  if (typeof delaisPaie !== "string") return null;
  const cleaned = delaisPaie.trim().toLowerCase();
  if (!cleaned) return null;
  if (cleaned === "comptant") return { days: 0, endOfMonth: false };
  const match = cleaned.match(/^(\d+)\s*jours(?:\s+(.*))?$/i);
  if (!match) return null;
  const days = Number(match[1]);
  if (!Number.isFinite(days)) return null;
  const rest = (match[2] || "").toLowerCase();
  const endOfMonth = rest.includes("fin de mois");
  return { days, endOfMonth };
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function endOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function getPublicationIdentity(normalisedSupports) {
  const entries = [];
  const seen = new Set();
  for (const item of normalisedSupports) {
    const supportName = typeof item?.supportName === "string" ? item.supportName.trim() : "";
    const numero = typeof item?.supportNumber === "string" ? item.supportNumber.trim() : "";
    const key = `${supportName}__${numero}`;
    if (!supportName && !numero) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({ supportName: supportName || "-", numero: numero || "-" });
  }

  if (!entries.length) return { primary: { supportName: "-", numero: "-" }, extraCount: 0 };
  return { primary: entries[0], extraCount: Math.max(entries.length - 1, 0) };
}

function generateHeader(doc, client, number, tva) {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("fr-FR");

  const clientSiret = typeof client?.siret === "string" ? client.siret.trim() : "";
  const clientVat = typeof client?.numTVA === "string" ? client.numTVA.trim() : "";
  const shouldShowCompanyIds = Boolean(clientSiret && clientVat);

  const supports = Array.isArray(client?.support) ? client.support : [];
  const normalisedSupports = supports.map((item) => {
    const rawNumber = item?.supportNumber ?? item?.number ?? item?.quantity ?? "";
    const supportNumber = typeof rawNumber === "string" && rawNumber.trim()
      ? rawNumber.trim()
      : Number.isFinite(Number(rawNumber))
      ? String(rawNumber)
      : "";
    const rawSupportName = item?.supportName || item?.support || item?.support_label || "";
    const supportName = typeof rawSupportName === "string" && rawSupportName.trim() ? rawSupportName.trim() : "";
    return {
      ...item,
      supportNumber,
      supportName,
    };
  });

  const publication = getPublicationIdentity(normalisedSupports);
  const tvaRate = toNumber(tva);
  const tvaPercent = tvaRate * 100;

  // Titre
  doc
    .font("Helvetica-Bold")
    .fontSize(22)
    .fillColor("#948a54")
    .text("BON DE COMMANDE", 50, 40, { align: "right" })
    .fillColor("black");

  // Logo
  doc.image("assets/Logo VA.jpg", 50, 40, { width: 150 });

  // Blocs VA (gauche) / Client (droite)
  const leftX = 50;
  const rightX = 330;
  const blockTopY = 105;
  const lineGap = 14;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("V.A. PRODUCTIONS", leftX, blockTopY)
    .font("Helvetica")
    .text("130 rue du Vallon de la Vierge bât. C", leftX, blockTopY + lineGap)
    .text("La Duranne", leftX, blockTopY + lineGap * 2)
    .text("13100 AIX-EN-PROVENCE", leftX, blockTopY + lineGap * 3)
    .text("Tel : 04 42 53 10 22", leftX, blockTopY + lineGap * 4)
    .text("N° TVA Intracommunautaire : FR18443242763", leftX, blockTopY + lineGap * 5)
    .text("N° SIRET : 44224276300037", leftX, blockTopY + lineGap * 6);

  const clientY = blockTopY;
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(client?.compagnyName ? client.compagnyName.toUpperCase() : "-", rightX, clientY)
    .font("Helvetica")
    .text(client?.address1 ? client.address1 : "-", rightX, clientY + lineGap)
    .text(client?.address2 ? client.address2 : "", rightX, clientY + lineGap * 2)
    .text(`${client?.postalCode || ""} ${client?.city || ""}`.trim() || "-", rightX, clientY + lineGap * 3)
    .text(shouldShowCompanyIds ? `N° TVA Intracommunautaire : ${clientVat}` : "", rightX, clientY + lineGap * 4)
    .text(shouldShowCompanyIds ? `N° SIRET : ${clientSiret}` : "", rightX, clientY + lineGap * 5);

  const headerBottomY = 200;

  // Date + numéro (en dessous)
  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .text(`Bon de commande N° ${number}`, 50, headerBottomY)
    .font("Helvetica")
    .fontSize(10)
    .text(formattedDate, 50, headerBottomY + 18);

  // Bloc identité de la publication
  const identityTop = headerBottomY + 85;
  doc
    .save()
    .fillColor("#f2f2f2")
    .rect(50, identityTop, 500, 45)
    .fill()
    .restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("black")
    .text("Identité de la publication", 50, identityTop - 16);

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#6b6b6b")
    .text("NOM DU SUPPORT", 60, identityTop + 8)
    .text("NUMÉRO", 420, identityTop + 8, { width: 120, align: "right" });

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("black")
    .text(publication.primary.supportName, 60, identityTop + 22)
    .text(publication.primary.numero, 420, identityTop + 22, { width: 120, align: "right" });

  if (publication.extraCount > 0) {
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#6b6b6b")
      .text(`(+${publication.extraCount} autre(s) support(s))`, 60, identityTop + 34);
  }

  // Espace sous le bloc identité
  const tableTop = identityTop + 70;
  return tableTop;
}

function generateInvoiceTable(doc, client, tva, signatureData, signatureFileName, tableTop = 330) {
  let currentPosition = tableTop;

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

  const tvaRate = toNumber(tva);
  const tvaPercent = tvaRate * 100;

  doc.font("Helvetica-Bold");
  generateOrderTableRow(doc, currentPosition, "Désignation", "Quantité", "PU Vente", "TVA", "Montant HT", true);
  currentPosition += 18;
  generateHr(doc, currentPosition);
  currentPosition += 12;
  
  doc.font("Helvetica");
  const subTotalSupports = normalisedSupports.reduce((sum, item) => sum + item.price, 0);

  normalisedSupports.forEach((item) => {
    const qty = 1;
    const unitPrice = item.price;
    generateOrderTableRow(
      doc,
      currentPosition,
      item.name,
      String(qty),
      `${formatPrice(unitPrice)} €`,
      formatPercent(tvaPercent),
      `${formatPrice(item.price)} €`
    );
    currentPosition += 22;
  });

  generateHr(doc, currentPosition);
  currentPosition += 18;

  const tvaAmount = subTotalSupports * tvaRate;
  const totalTTC = subTotalSupports + tvaAmount;

  // Totaux (style facture)
  const totalsBoxX = 360;
  const totalsBoxWidth = 190;
  const totalsBoxHeight = 60;
  doc
    .save()
    .fillColor("#f2f2f2")
    .rect(totalsBoxX, currentPosition, totalsBoxWidth, totalsBoxHeight)
    .fill()
    .restore();

  const labelX = totalsBoxX + 10;
  const valueX = totalsBoxX + totalsBoxWidth - 10;
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor("black")
    .text("Total HT", labelX, currentPosition + 8)
    .text(`${formatPrice(subTotalSupports)} €`, labelX, currentPosition + 8, { width: totalsBoxWidth - 20, align: "right" })
    .text(`TVA (${formatPercent(tvaPercent)} %)`, labelX, currentPosition + 26)
    .text(`${formatPrice(tvaAmount)} €`, labelX, currentPosition + 26, { width: totalsBoxWidth - 20, align: "right" });

  doc
    .font("Helvetica-Bold")
    .text("Total TTC", labelX, currentPosition + 44)
    .text(`${formatPrice(totalTTC)} €`, labelX, currentPosition + 44, { width: totalsBoxWidth - 20, align: "right" });

  currentPosition += totalsBoxHeight + 20;

  let paymentTermsText = "Total dû à réception de la commande."; 
  if (client && client.delaisPaie) {
    if (client.delaisPaie.toLowerCase() === 'comptant') {
      paymentTermsText = "Total dû comptant à réception de la commande.";
    } else {
      paymentTermsText = `Total dû dans un délai de ${client.delaisPaie}.`;
    }
  }

  const delay = parsePaymentDelayDays(client?.delaisPaie);
  let dueDateLine = "";
  if (delay) {
    let due = addDays(currentDateForDue(), delay.days);
    if (delay.endOfMonth) {
      due = endOfMonth(due);
    }
    dueDateLine = `Échéance : ${due.toLocaleDateString("fr-FR")}`;
  }

  doc
    .font("Helvetica")
    .fontSize(9)
    .text("Veuillez rédiger tous les chèques à l'ordre de V.A. PRODUCTIONS.", 50, currentPosition)
    .text(paymentTermsText, 50, currentPosition + 12)
    .text(dueDateLine, 50, currentPosition + 24)
    .text("Comptes en souffrance soumis à des frais de service de 1 % par mois.", 50, currentPosition + 36);
  currentPosition += 70;
  
  doc.font("Helvetica-Bold").fontSize(12).text("MERCI DE VOTRE CONFIANCE !", 50, currentPosition, { align: "center" });
  currentPosition += 40;

  doc
    .text("Signature", 50, currentPosition + 44);

  const signatureBuffer = getSignatureBuffer(signatureData, signatureFileName || client?.signature);
  if (signatureBuffer) {
    try {
      doc.image(signatureBuffer, 250, currentPosition + 10, { width: 150 });
    } catch (error) {
      console.error("Impossible d'intégrer la signature dans le PDF:", error);
    }
  }
}

function currentDateForDue() {
  return new Date();
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

function generateOrderTableRow(doc, y, designation, qty, unitPrice, vat, amount, isHeader = false) {
  const fontSize = isHeader ? 9 : 10;
  doc
    .fontSize(fontSize)
    .text(designation, 50, y, { width: 200 })
    .text(qty, 260, y, { width: 60, align: "right" })
    .text(unitPrice, 320, y, { width: 80, align: "right" })
    .text(vat, 400, y, { width: 60, align: "right" })
    .text(amount, 460, y, { width: 90, align: "right" });
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

      const tableTop = generateHeader(doc, client, number, tva);
      generateInvoiceTable(doc, client, tva, signatureData, signatureFileName, tableTop);
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

export default createOrderPdf;