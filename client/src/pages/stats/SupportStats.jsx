import React, { useMemo } from "react";
import { CSVLink } from "react-csv";

const SupportStats = ({ name, image, invoices }) => {
  const { totalRevenue, invoiceCount, lastOrderDate, filteredInvoices } = useMemo(() => {
    const filteredInvoices = invoices
      .map((invoice) => ({
        ...invoice,
        supportList: invoice.supportList.filter(
          (support) => support.supportName.toLowerCase() === name.toLowerCase()
        ),
      }))
      .filter((invoice) => invoice.supportList.length > 0);

    const totalRevenue = filteredInvoices.reduce((sum, invoice) => {
      return sum + invoice.supportList.reduce((innerSum, support) => innerSum + support.price, 0);
    }, 0);

    const invoiceCount = filteredInvoices.length;

    const lastOrderDate = filteredInvoices
        .map((invoice) => new Date(invoice.date))
        .sort((a, b) => b - a)[0]
        ?.toLocaleDateString("fr-FR") || "N/A";

    return { totalRevenue, invoiceCount, lastOrderDate, filteredInvoices };
  }, [invoices, name]);

  const csvHeaders = [
    { label: "Numéro de Facture", key: "numero_facture" },
    { label: "Client", key: "client" },
    { label: "Date de Facture", key: "date_facture" },
  { label: "Encart", key: "support_encart" },
    { label: "Prix du Support (€)", key: "support_prix" },
  ];

  const csvData = filteredInvoices.flatMap(invoice => 
    invoice.supportList.map(support => ({
      numero_facture: invoice.number,
      client: invoice.entreprise,
      date_facture: new Date(invoice.date).toLocaleDateString("fr-FR"),
  support_encart: support.name,
      support_prix: support.price,
    }))
  );
  
  return (
    <div className="min-h-[300px] w-full px-4 py-4 pb-6 relative overflow-hidden bg-[#3f3f3f] rounded flex flex-col">
      <span className="bg-gradient absolute left-0 bottom-0 h-[50%] z-[30] w-full opacity-90"></span>
      <img
        src={image}
        className="absolute w-[200%] h-[200%] blur-[20px] left-[-50%] top-[-50%] z-10 translate-x-[50%] opacity-40"
      />
      <img
        src={image}
        alt="image support"
        className="rounded-lg object-cover w-full h-44 z-[20] relative"
      />
      <div className="flex w-full justify-between items-center mt-2 z-40">
        <p className="font-semibold text-2xl mt-2 text-white">{name}</p>
      </div>

      <div className="flex mt-4 justify-between z-40 text-white">
        <div className="flex flex-col items-center w-24">
          <p className="opacity-80 text-sm font-light">Revenu</p>
          <p className="font-bold ">{totalRevenue.toLocaleString("fr-FR")}€</p>
        </div>
        <div className="flex flex-col items-center w-24">
          <p className="opacity-80 text-sm font-light">Factures</p>
          <p className="font-bold ">{invoiceCount}</p>
        </div>
        <div className="flex flex-col items-center w-44">
          <p className="opacity-80 text-xs font-light">Dernière commande</p>
          <p className="font-bold ">{lastOrderDate}</p>
        </div>
      </div>
      
      <div className="mt-auto z-40 relative">
        {csvData.length > 0 && (
          <CSVLink
            data={csvData}
            headers={csvHeaders}
            filename={`export-stats-${name}.csv`}
            className="w-full text-center block mt-4 bg-white bg-opacity-90 text-[#3f3f3f] font-semibold py-2 px-4 rounded hover:bg-opacity-100 transition-all"
            target="_blank"
            separator={";"}
          >
            Exporter les données de {name}
          </CSVLink>
        )}
      </div>
    </div>
  );
};

export default SupportStats;