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

function createOrderPdf(client, res, number, tva, randomImageName) {
  const invoicesDir = "./orders";
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir);
  }
  const fileName = `${number}_${client?.compagnyName?.toUpperCase() || "COMMANDE"}.pdf`;
  const filePath = path.join(invoicesDir, fileName);

  let doc = new PDFDocument({ margin: 50 });
  const writeStream = fs.createWriteStream(filePath);
  writeStream.on("error", (err) => console.error("Erreur d'écriture PDF :", err));

  doc.pipe(writeStream);
  generateHeader(doc, client, number);
  generateInvoiceTable(doc, client, tva, randomImageName);
  doc.end();

  writeStream.on("finish", () => {
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error("Erreur d'envoi PDF :", err);
        if (!res.headersSent) {
          res.status(500).send("Erreur lors de l'envoi du PDF.");
        }
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

  if (client.costs && client.costs.length > 0) {
    const totalCosts = client.costs.reduce((sum, cost) => sum + toNumber(cost.amount), 0);
    const netRevenue = subTotalSupports - totalCosts;

    doc.font("Helvetica-Bold").text("FRAIS ASSOCIÉS", 50, currentPosition);
    currentPosition += 15;
    generateHr(doc, currentPosition);
    currentPosition += 10;

    doc.font("Helvetica");
    client.costs.forEach((cost) => {
      const description = cost?.description || cost?.label || cost?.name || "";
      const amount = toNumber(cost?.amount);
      generateTableRow(doc, currentPosition, description, "", "", `-${formatPrice(amount)} €`);
      currentPosition += 20;
    });
    generateHr(doc, currentPosition);
    currentPosition += 10;

    doc.font("Helvetica-Bold");
    generateTableRow(doc, currentPosition, "", "", "TOTAL FRAIS", `-${formatPrice(totalCosts)} €`);
    currentPosition += 25;
    
    generateTableRow(doc, currentPosition, "", "", "BÉNÉFICE (HT)", `${formatPrice(netRevenue)} €`);
    currentPosition += 25;
  }

  const tvaRate = toNumber(tva);
  const tvaAmount = subTotalSupports * tvaRate;
  const totalTTC = subTotalSupports + tvaAmount;

  generateTableRow(doc, currentPosition, "", "", "T.V.A.", `${formatPrice(tvaAmount)} €`);
  currentPosition += 20;

  doc.font("Helvetica-Bold");
  generateTableRow(doc, currentPosition, "", "", "TOTAL À PAYER (TTC)", `${formatPrice(totalTTC)} €`);
  currentPosition += 40;

  doc
    .font("Helvetica")
    .fontSize(9)
    .text("Veuillez rédiger tous les chèques à l'ordre de V.A. PRODUCTIONS.", 50, currentPosition)
    .text("Total dû dans un délai de 15 jours. Comptes en souffrance soumis à des frais de service de 1 % par mois.", 50, currentPosition + 12);
  currentPosition += 50;
  
  doc.font("Helvetica-Bold").fontSize(12).text("MERCI DE VOTRE CONFIANCE !", 50, currentPosition, { align: "center" });
  currentPosition += 40;
  
  doc.text("Signature", 100, currentPosition);
  
  const imgPath = path.join(process.cwd(), "invoices", `${randomImageName}.png`);
  if (fs.existsSync(imgPath)) {
    doc.image(imgPath, 50, currentPosition + 15, { width: 150 });
  } else {
    console.log("Fichier signature introuvable:", imgPath);
  }
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

export function createOrderPdfBuffer(client, number, tva, randomImageName) {
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
      generateInvoiceTable(doc, client, tva, randomImageName);
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

export default createOrderPdf;