import { prepareFacturXData } from '../utils/facturXDataHelper.js';
import Invoice from '../model/invoiceModel.js';
import Contact from '../model/contactModel.js'; 
import { createFacturXBuffer } from '../utils/facturXCreator.js';
import fs from 'fs';

export const sendEInvoice = async (req, res) => {
    const { id } = req.params;
    console.log(`Requête reçue pour envoyer la facture ${id}`);

    try {
        const invoice = await Invoice.findById(id);

        if (!invoice) {
            console.error(`Facture ${id} non trouvée.`);
            return res.status(404).json({ erreur: "Facture non trouvée." });
        }
        if (['sent', 'validated', 'processing'].includes(invoice.eInvoiceStatus)) {
            console.warn(`Tentative d'envoi d'une facture déjà traitée : ${id}`);
            return res.status(400).json({ erreur: "Cette facture est déjà envoyée ou en cours de traitement." });
        }

        invoice.eInvoiceStatus = 'processing';
        await invoice.save();
        console.log(`Statut de la facture ${id} mis à 'processing'. Réponse envoyée au client.`);
        res.status(202).json(invoice); 
        generateAndSendInBackground(invoice);

    } catch (error) {
        console.error(`Erreur critique dans sendEInvoice pour la facture ${id}:`, error);
        res.status(500).json({ erreur: "Erreur lors du lancement du processus d'envoi." });
    }
};

async function generateAndSendInBackground(invoice) {
    console.log(`Démarrage pour facture ${invoice.number}`);
    try {
        const contact = await Contact.findById(invoice.client);
        if (!contact) {
            throw new Error("Contact associé à la facture introuvable.");
        }

        console.log(`Préparation des données Factur-X...`);
        const facturXDataObject = prepareFacturXData(invoice, contact);
        console.log(`Données préparées avec succès.`);

        console.log(`Génération du buffer Factur-X...`);
        const facturXBuffer = await createFacturXBuffer(invoice, contact);
        console.log(`Buffer Factur-X généré.`);

        fs.writeFileSync(`facture_${invoice.number}_factur-x.pdf`, facturXBuffer);
        console.log(`Fichier de test 'facture_${invoice.number}_factur-x.pdf' sauvegardé !`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`Mise à jour du statut en 'sent'`);
        await Invoice.findByIdAndUpdate(invoice._id, { eInvoiceStatus: 'sent' });
        console.log(`Statut de la facture ${invoice.number} mis à jour.`);
    
    } catch (error) {
        console.error(`ERREUR lors du traitement de la facture ${invoice.number}:`, error.message);
        await Invoice.findByIdAndUpdate(invoice._id, { eInvoiceStatus: 'rejected' });
    }
}