import StatChart from "./StatChart";
import PieChartStats from "./PieChartStats";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import YearlySupportStats from "./YearlySupportStats";
import "./stats.css";
import useAuth from "../../hooks/useAuth"; 

import { CSVLink } from "react-csv";
import { buildSupportColorMap } from "./supportColorMap";
import PageHeader from "../../components/PageHeader";

const Stats = () => {
  const { isAdmin } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [magazines, setMagazines] = useState([]);
  const [isInvoicesLoading, setIsInvoicesLoading] = useState(true);
  const [isMagazinesLoading, setIsMagazinesLoading] = useState(true);
  const [paidOnly, setPaidOnly] = useState(false);
  // Palette de base (utilisée en priorité), complétée automatiquement si besoin
  const colorList = [
    "#2563eb", // Bleu
    "#ef4444", // Rouge
    "#22c55e", // Vert
    "#a855f7", // Violet
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#eab308", // Jaune
    "#14b8a6", // Teal
    "#f43f5e", // Rose
    "#84cc16", // Lime
    "#0ea5e9", // Sky
    "#8b5cf6", // Purple
    "#10b981", // Emerald
    "#fb7185", // Rose clair
    "#3b82f6", // Blue clair
    "#f59e0b", // Amber
    "#16a34a", // Green foncé
    "#dc2626", // Red foncé
    "#7c3aed", // Violet foncé
    "#0891b2", // Cyan foncé
  ];

  const fetchInvoices = async () => {
    setIsInvoicesLoading(true);
    try {
      const response = await axios.get(
        import.meta.env.VITE_API_HOST + "/api/invoice/"
      );
      setInvoices(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des invoices", error);
    } finally {
      setIsInvoicesLoading(false);
    }
  };

  const fetchMagazines = async () => {
    setIsMagazinesLoading(true);
    try {
      const response = await axios.get(
        import.meta.env.VITE_API_HOST + "/api/magazine/"
      );
      setMagazines(Array.isArray(response.data?.magazines) ? response.data.magazines : []);
    } catch (error) {
      console.error("Erreur lors de la récupération des magazines", error);
      setMagazines([]);
    } finally {
      setIsMagazinesLoading(false);
    }
  };

  useEffect(() => {
     if (isAdmin) {
    fetchInvoices();
    fetchMagazines();
    }
  }, [isAdmin]);

  const isStatsLoading = isInvoicesLoading || isMagazinesLoading;

  // Filtrer les factures pour exclure les magazines supprimés
  const filteredInvoices = useMemo(() => {
    // Tant que les magazines ne sont pas connus, on ne veut pas afficher de données "non filtrées"
    if (isMagazinesLoading) return [];

    // Aucun magazine actif => rien à afficher dans les stats par support
    if (!Array.isArray(magazines) || magazines.length === 0) return [];
    
    const activeMagazineNames = new Set(
      magazines.map(mag => mag.nom.toLowerCase().trim())
    );
    
    return invoices.map(invoice => {
      if (!invoice.supportList || invoice.supportList.length === 0) return invoice;
      
      const filteredSupportList = invoice.supportList.filter(support => {
        const normalizedSupport = support.supportName.toLowerCase().trim();
        const isActive = activeMagazineNames.has(normalizedSupport);
        return isActive;
      });
      
      return {
        ...invoice,
        supportList: filteredSupportList
      };
    }).filter(invoice => invoice.supportList && invoice.supportList.length > 0);
  }, [invoices, magazines]);

  const invoicesLast12Months = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 11, 1);

    return filteredInvoices.filter((invoice) => {
      const invoiceDate = new Date(invoice?.date);
      if (Number.isNaN(invoiceDate.getTime())) {
        return false;
      }

      return invoiceDate >= startDate && invoiceDate <= endDate;
    });
  }, [filteredInvoices]);

  const supportColorMap = useMemo(() => {
    const supportNames = invoicesLast12Months.flatMap((invoice) =>
      invoice.supportList.map((support) => support.supportName)
    );

    return buildSupportColorMap(supportNames, colorList);
  }, [invoicesLast12Months]);

  const invoicesFiltered = useMemo(() => {
    if (!paidOnly) return filteredInvoices;
    return filteredInvoices.filter((invoice) => invoice.status === "paid");
  }, [filteredInvoices, paidOnly]);

  const invoicesLast12MonthsFiltered = useMemo(() => {
    if (!paidOnly) return invoicesLast12Months;
    return invoicesLast12Months.filter((invoice) => invoice.status === "paid");
  }, [invoicesLast12Months, paidOnly]);

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
  const csvData = invoicesFiltered.flatMap(invoice => 
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
      <PageHeader
        title="Statistiques des supports"
        description="Statistiques des supports"
        storageKey="page-header:statistiques"
        className="mt-10"
        actions={
          <>
            <label className="flex items-center justify-between gap-4 w-full md:w-auto px-3 py-2 bg-white border border-[#E1E1E1] rounded-md">
              <span className="text-[#3F3F3F] opacity-80 font-medium">
                Payées uniquement
              </span>
              <span className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={paidOnly}
                  onChange={(e) => setPaidOnly(e.target.checked)}
                  className="peer sr-only"
                  role="switch"
                  aria-label="Afficher uniquement les factures payées"
                />
                <span className="h-6 w-11 rounded-full border border-[#E1E1E1] bg-[#F7F7F7] transition-colors peer-checked:bg-[#3F3F3F] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#3F3F3F]" />
                <span className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
              </span>
            </label>

            {!isStatsLoading && invoicesFiltered.length > 0 && (
              <CSVLink
                data={csvData}
                headers={csvHeaders}
                filename={"export-statistiques-va-production.csv"}
                className="bg-[#3F3F3F] text-white font-semibold py-2 px-4 rounded hover:bg-opacity-80 transition-all w-full md:w-auto text-center"
                target="_blank"
                separator={";"} 
              >
                Exporter les Données (CSV)
              </CSVLink>
            )}
          </>
        }
      />

      <div className="flex flex-col lg:flex-row mt-4 gap-3">
        {isStatsLoading ? (
          <div className="w-full text-center text-[#3F3F3F] opacity-70 py-12">
            Chargement des statistiques...
          </div>
        ) : (
          <>
            <StatChart
              invoices={invoicesLast12MonthsFiltered}
              supportColorMap={supportColorMap}
            />
            <PieChartStats
              invoices={invoicesLast12MonthsFiltered}
              supportColorMap={supportColorMap}
            />
          </>
        )}
      </div>
      <p className="font-bold text-lg text-[#3F3F3F] leading-3 mt-16">
        Statistiques par support
      </p>
      <p className="text-[#3F3F3F] opacity-80 ">
        Statistiques pour chacun des supports
      </p>
      <YearlySupportStats invoices={invoicesFiltered} />
    </div>
  );
};

export default Stats;