import { create } from 'xmlbuilder2';

const formatCurrency = (value) => (Number(value) || 0).toFixed(2);
const formatDate102 = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

export function generateFacturXXML(data) {
  const namespaces = {
    'xmlns:rsm': 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100',
    'xmlns:ram': 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100',
    'xmlns:udt': 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100',
  };
  const root = create({ version: '1.0', encoding: "UTF-8" }).ele('rsm:CrossIndustryInvoice', namespaces);

  // Informations générales 
  root.ele('rsm:ExchangedDocumentContext')
      .ele('ram:GuidelineSpecifiedDocumentContextParameter')
        .ele('ram:ID').txt('urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:minimum').up()
      .up()
    .up()
    .ele('rsm:ExchangedDocument')
      .ele('ram:ID').txt(data.invoiceNumber).up()
      .ele('ram:TypeCode').txt('380').up()
      .ele('ram:IssueDateTime').ele('udt:DateTimeString', { format: '102' }).txt(formatDate102(data.issueDate)).up().up()
    .up();

  const trade = root.ele('rsm:SupplyChainTradeTransaction');

  // Lignes de la facture 
  data.items.forEach((item, index) => {
    trade.ele('ram:IncludedSupplyChainTradeLineItem')
      .ele('ram:AssociatedDocumentLineDocument')
        .ele('ram:LineID').txt(index + 1).up()
      .up()
      .ele('ram:SpecifiedTradeProduct')
        .ele('ram:Name').txt(item.description || item.name || 'Article').up()
      .up()
      .ele('ram:SpecifiedLineTradeAgreement')
        .ele('ram:NetPriceProductTradePrice')
          .ele('ram:ChargeAmount', { currencyID: 'EUR' }).txt(formatCurrency(item.unitPrice)).up()
        .up()
      .up()
      .ele('ram:SpecifiedLineTradeDelivery')
        .ele('ram:BilledQuantity', { unitCode: item.unit || 'C62' }).txt(item.quantity).up()
      .up()
      .ele('ram:SpecifiedLineTradeSettlement')
        .ele('ram:ApplicableTradeTax')
          .ele('ram:TypeCode').txt('VAT').up()
          .ele('ram:CategoryCode').txt('S').up()
          .ele('ram:RateApplicablePercent').txt(formatCurrency(item.vatRate)).up()
        .up()
        .ele('ram:SpecifiedTradeSettlementLineMonetarySummation')
          .ele('ram:LineTotalAmount', { currencyID: 'EUR' }).txt(formatCurrency(item.totalPrice)).up()
        .up()
      .up()
    .up();
  });

  // Informations sur le vendeur et l'acheteur
  trade.ele('ram:ApplicableHeaderTradeAgreement')
    .ele('ram:SellerTradeParty')
      .ele('ram:Name').txt(data.seller.name).up()
      .ele('ram:PostalTradeAddress')
        .ele('ram:PostcodeCode').txt(data.seller.postalCode).up()
        .ele('ram:LineOne').txt(data.seller.address).up()
        .ele('ram:CityName').txt(data.seller.city).up()
        .ele('ram:CountryID').txt(data.seller.country).up()
      .up()
      .ele('ram:SpecifiedTaxRegistration')
        .ele('ram:ID', { schemeID: 'VA' }).txt(data.seller.vatNumber).up()
      .up()
      .ele('ram:SpecifiedTaxRegistration')
        .ele('ram:ID', { schemeID: 'FC' }).txt(data.seller.siret).up()
      .up()
    .up()
    .ele('ram:BuyerTradeParty')
      .ele('ram:Name').txt(data.buyer.name).up()
      .ele('ram:PostalTradeAddress')
        .ele('ram:PostcodeCode').txt(data.buyer.postalCode).up()
        .ele('ram:LineOne').txt(data.buyer.address).up()
        .ele('ram:CityName').txt(data.buyer.city).up()
        .ele('ram:CountryID').txt(data.buyer.country).up()
      .up()
      .ele('ram:SpecifiedTaxRegistration')
        .ele('ram:ID', { schemeID: 'VA' }).txt(data.buyer.vatNumber || '').up()
      .up()
      .ele('ram:SpecifiedTaxRegistration')
        .ele('ram:ID', { schemeID: 'FC' }).txt(data.buyer.siret).up()
      .up()
    .up()
  .up();
  
  // Informations de livraison 
  trade.ele('ram:ApplicableHeaderTradeDelivery').up();

  // Totaux et informations de paiement 
  const settlement = trade.ele('ram:ApplicableHeaderTradeSettlement')
    .ele('ram:InvoiceCurrencyCode').txt('EUR').up();

  const vatByRate = {};
  data.items.forEach(item => {
    const rate = item.vatRate || 20;
    if (!vatByRate[rate]) {
      vatByRate[rate] = { base: 0, amount: 0 };
    }
    vatByRate[rate].base += item.totalPrice;
    vatByRate[rate].amount += item.totalPrice * rate / 100;
  });

  Object.keys(vatByRate).forEach(rate => {
    settlement.ele('ram:ApplicableTradeTax')
      .ele('ram:CalculatedAmount', { currencyID: 'EUR' }).txt(formatCurrency(vatByRate[rate].amount)).up()
      .ele('ram:TypeCode').txt('VAT').up()
      .ele('ram:BasisAmount', { currencyID: 'EUR' }).txt(formatCurrency(vatByRate[rate].base)).up()
      .ele('ram:CategoryCode').txt('S').up()
      .ele('ram:RateApplicablePercent').txt(formatCurrency(rate)).up()
    .up();
  });

  settlement.ele('ram:SpecifiedTradeSettlementHeaderMonetarySummation')
    .ele('ram:LineTotalAmount', { currencyID: 'EUR' }).txt(formatCurrency(data.totals.netTotal)).up()
    .ele('ram:TaxBasisTotalAmount', { currencyID: 'EUR' }).txt(formatCurrency(data.totals.netTotal)).up()
    .ele('ram:TaxTotalAmount', { currencyID: 'EUR' }).txt(formatCurrency(data.totals.vatTotal)).up()
    .ele('ram:GrandTotalAmount', { currencyID: 'EUR' }).txt(formatCurrency(data.totals.grossTotal)).up()
    .ele('ram:DuePayableAmount', { currencyID: 'EUR' }).txt(formatCurrency(data.totals.grossTotal)).up()
  .up();
  
  return root.end({ prettyPrint: false });
}