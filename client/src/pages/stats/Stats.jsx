import StatChart from "./StatChart";
import PieChartStats from "./PieChartStats";
import { useEffect, useState } from "react";
import axios from "axios";
import YearlySupportStats from "./YearlySupportStats";
import "./stats.css";
import useAuth from "../../hooks/useAuth"; 

import { CSVLink } from "react-csv";

const Stats = () => {
  const { isAdmin } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const colorList = ["#ef4444", "#2563eb", "#22c55e", "#7c3aed"];

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(
        import.meta.env.VITE_API_HOST + "/api/invoice/"
      );
      setInvoices(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des invoices", error);
    }
  };

  useEffect(() => {
     if (isAdmin) {
    fetchInvoices();
    }
  }, [isAdmin]);

  // On définit les colonnes de notre fichier CSV
  const csvHeaders = [
    { label: "Numéro de Facture", key: "numero_facture" },
    { label: "Client", key: "client" },
    { label: "Date de Facture", key: "date_facture" },
    { label: "Statut du Paiement", key: "statut_paiement" },
    { label: "Nom du Support", key: "support_nom" },
  { label: "Encart", key: "support_encart" },
    { label: "Prix du Support (€)", key: "support_prix" },
    { label: "Montant Total de la Facture (€)", key: "montant_total_facture" },
  ];

  // On transforme nos données complexes en un tableau simple
  const csvData = invoices.flatMap(invoice => 
    invoice.supportList.map(support => ({
      numero_facture: invoice.number,
      client: invoice.entreprise,
      date_facture: new Date(invoice.date).toLocaleDateString("fr-FR"),
      statut_paiement: invoice.status === 'paid' ? 'Payé' : 'Non Payé',
      support_nom: support.supportName,
  support_encart: support.name,
      support_prix: support.price,
      montant_total_facture: invoice.totalPrice
    }))
  );

  if (!isAdmin) {
    return <div>Accès refusé. Vous devez être administrateur pour voir cette page.</div>;
  }

    return (
    <div className="mb-10">
      <div className="flex justify-between items-center mt-10">
        <div>
          <p className="font-bold text-lg text-[#3F3F3F] leading-3">
            Statistiques des supports
          </p>
          <p className="text-[#3F3F3F] opacity-80">Statistiques des supports</p>
        </div>

        {invoices.length > 0 && (
          <CSVLink
            data={csvData}
            headers={csvHeaders}
            filename={"export-statistiques-va-production.csv"}
            className="bg-[#3F3F3F] text-white font-semibold py-2 px-4 rounded hover:bg-opacity-80 transition-all"
            target="_blank"
            separator={";"} 
          >
            Exporter les Données (CSV)
          </CSVLink>
        )}
      </div>

      <div className="flex mt-4 gap-3">
        <StatChart invoices={invoices} colorList={colorList} />
        <PieChartStats invoices={invoices} colorList={colorList} />
      </div>
      <p className="font-bold text-lg text-[#3F3F3F] leading-3 mt-16">
        Statistiques par support
      </p>
      <p className="text-[#3F3F3F] opacity-80 ">
        Statistiques pour chacun des supports
      </p>
      <YearlySupportStats invoices={invoices} />
    </div>
  );
};

export default Stats;
