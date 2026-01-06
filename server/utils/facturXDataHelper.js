export function prepareFacturXData(invoice, contact) {
  const errors = [];
  if (!process.env.VAPRODUCTIONS_SIRET) errors.push("Le SIRET de votre entreprise (VAPRODUCTIONS_SIRET) n'est pas défini dans le fichier .env");
  if (!process.env.VAPRODUCTIONS_VAT) errors.push("Le N° de TVA de votre entreprise (VAPRODUCTIONS_VAT) n'est pas défini dans le fichier .env");
  if (!contact?.siret) errors.push(`Le SIRET est manquant pour le client ${contact?.company || 'inconnu'}`);
  if (!contact?.numTVA) errors.push(`Le N° de TVA est manquant pour le client ${contact?.company || 'inconnu'}`);
  
  if (errors.length > 0) {
    throw new Error(`Données Factur-X incomplètes : \n- ${errors.join('\n- ')}`);
  }
  
  const seller = {
    name: "V.A. Productions",
    siret: process.env.VAPRODUCTIONS_SIRET,
    vatNumber: process.env.VAPRODUCTIONS_VAT,
    address: "130 rue du Vallon de la Vierge bât. C",
    city: "AIX-EN-PROVENCE",
    postalCode: "13100",
    country: "FR",
  };

  const buyer = {
    name: contact.company,
    siret: contact.siret,
    vatNumber: contact.numTVA,
    address: invoice.firstAddress,
    city: invoice.city,
    postalCode: invoice.postalCode,
    country: "FR",
  };

  const items = invoice.supportList.map(item => ({
    name: item.name,
    description: item.supportName,
    quantity: item.supportNumber || 1,
    unitPrice: item.price,
    vatRate: invoice.tva * 100,
    vatCategoryCode: 'S',
    unitCode: 'H87',
  }));
  
  const totals = {
    netTotal: invoice.totalPrice,
    vatTotal: invoice.totalPrice * invoice.tva,
    grossTotal: invoice.totalPrice * (1 + invoice.tva),
  };

  return {
    invoiceNumber: invoice.number,
    issueDate: invoice.date,
    seller,
    buyer,
    items,
    totals,
  };
}