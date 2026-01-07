import PDFDocument from 'pdfkit';
import { prepareFacturXData } from './facturXDataHelper.js';
import { generateFacturXXML } from './xmlGenerator.js';
import { generateHeader, generateInvoiceTable } from './invoiceCreator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontPath = path.resolve(__dirname, 'Roboto-Regular.ttf');
const fontBoldPath = path.resolve(__dirname, 'Roboto-Bold.ttf');

export function createFacturXBuffer(invoice, contact) {
  return new Promise((resolve, reject) => {
    try {
      const facturXDataObject = prepareFacturXData(invoice, contact);
      const xmlString = generateFacturXXML(facturXDataObject);
      
      const doc = new PDFDocument({
        autoFirstPage: false,
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // On attache le fichier xml
      doc.file(Buffer.from(xmlString), {
        name: 'factur-x.xml',
        type: 'application/xml',
        afRelationship: 'Data',
      });

      doc.registerFont('Roboto', fontPath);
      doc.registerFont('Roboto-Bold', fontBoldPath);
      
      doc.addPage();
      const tableTop = generateHeader(doc, invoice, invoice.number, contact);
      generateInvoiceTable(doc, invoice, invoice.tva, contact, tableTop);
      
      doc.end();

    } catch (e) {
      reject(e);
    }
  });
}