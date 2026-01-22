import StatChart from "./StatChart";
import PieChartStats from "./PieChartStats";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import YearlySupportStats from "./YearlySupportStats";
import "./stats.css";
import useAuth from "../../hooks/useAuth"; 
import RevenueGoal from "./RevenueGoal";

import { CSVLink } from "react-csv";
import { buildSupportColorMap } from "./supportColorMap";

import GlobalStatsCards from "./GlobalStatsCards";
import TopClients from "./TopClients";

const Stats = () => {
  const { isAdmin } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [magazines, setMagazines] = useState([]);
  const [charges, setCharges] = useState([]); // Pour stocker les dépenses
  
  const [isInvoicesLoading, setIsInvoicesLoading] = useState(true);
  const [isMagazinesLoading, setIsMagazinesLoading] = useState(true);
  
  const [paidOnly, setPaidOnly] = useState(false);
  const [selectedYear, setSelectedYear] = useState("rolling");

  const colorList = [
    "#2563eb", "#ef4444", "#22c55e", "#a855f7", "#06b6d4", 
    "#f97316", "#eab308", "#14b8a6", "#f43f5e", "#84cc16", 
    "#0ea5e9", "#8b5cf6", "#10b981", "#fb7185", "#3b82f6", 
    "#f59e0b", "#16a34a", "#dc2626", "#7c3aed", "#0891b2", 
  ];

  useEffect(() => {
    if (isAdmin) {
      const loadData = async () => {
        setIsInvoicesLoading(true);
        setIsMagazinesLoading(true);
        try {
          // On récupère Factures, Magazines, et charges
          const [invRes, magRes, chargeRes] = await Promise.all([
            axios.get(import.meta.env.VITE_API_HOST + "/api/invoice/"),
            axios.get(import.meta.env.VITE_API_HOST + "/api/magazine/"),
            axios.get(import.meta.env.VITE_API_HOST + "/api/charge", {
              params: { type: "result" } // On veut les montants du Compte de Résultat
            }) 
          ]);
          
          setInvoices(invRes.data);
          setMagazines(Array.isArray(magRes.data?.magazines) ? magRes.data.magazines : []);
          setCharges(Array.isArray(chargeRes.data?.charges) ? chargeRes.data.charges : []);
          
        } catch (error) {
          console.error("Erreur chargement données", error);
        } finally {
          setIsInvoicesLoading(false);
          setIsMagazinesLoading(false);
        }
      };
      loadData();
    }
  }, [isAdmin]);

  const isStatsLoading = isInvoicesLoading || isMagazinesLoading;

  // Filtrage des Factures (Par date de facture)
  const invoicesFilteredByDate = useMemo(() => {
    let targetInvoices = invoices;
    if (paidOnly) targetInvoices = targetInvoices.filter((inv) => inv.status === "paid");

    if (selectedYear === "rolling") {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);
        return targetInvoices.filter((inv) => {
            const d = new Date(inv?.date);
            return !Number.isNaN(d.getTime()) && d >= startDate && d <= endDate;
        });
    } else {
        const yearTarget = parseInt(selectedYear);
        return targetInvoices.filter((inv) => {
            const d = new Date(inv?.date);
            return !Number.isNaN(d.getTime()) && d.getFullYear() === yearTarget;
        });
    }
  }, [invoices, selectedYear, paidOnly]);


  //  Filtrage des CHARGES (Par date de modification 'updatedAt')
  const chargesFilteredByDate = useMemo(() => {
    if (!charges || charges.length === 0) return [];

    if (selectedYear === "rolling") {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1);
        return charges.filter((charge) => {
            const d = new Date(charge.updatedAt); 
            return !Number.isNaN(d.getTime()) && d >= startDate && d <= endDate;
        });
    } else {
        const yearTarget = parseInt(selectedYear);
        return charges.filter((charge) => {
            const d = new Date(charge.updatedAt);
            return !Number.isNaN(d.getTime()) && d.getFullYear() === yearTarget;
        });
    }
  }, [charges, selectedYear]);


  // Filtrage pour les graphiques (Uniquement magazines actifs)
  const invoicesForCharts = useMemo(() => {
     if (isMagazinesLoading || !Array.isArray(magazines) || magazines.length === 0) return [];
     
     const activeMagazineNames = new Set(
       magazines.map(mag => mag.nom.toLowerCase().trim())
     );
     
     return invoicesFilteredByDate.map(invoice => {
       if (!invoice.supportList || invoice.supportList.length === 0) return invoice;
       
       const filteredSupportList = invoice.supportList.filter(support => {
         const normalizedSupport = support.supportName.toLowerCase().trim();
         return activeMagazineNames.has(normalizedSupport);
       });
       
       return { ...invoice, supportList: filteredSupportList };
     }).filter(invoice => invoice.supportList && invoice.supportList.length > 0);
  }, [invoicesFilteredByDate, magazines, isMagazinesLoading]);

  const supportColorMap = useMemo(() => {
      const supportNames = invoicesForCharts.flatMap((invoice) => invoice.supportList.map((support) => support.supportName));
      return buildSupportColorMap(supportNames, colorList);
  }, [invoicesForCharts]);

  // Export CSV
  const csvData = invoicesForCharts.flatMap(invoice => 
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

  const csvHeaders = [
    { label: "Numéro", key: "numero_facture" },
    { label: "Client", key: "client" },
    { label: "Date", key: "date_facture" },
    { label: "Statut", key: "statut_paiement" },
    { label: "Support", key: "support_nom" },
    { label: "Encart", key: "support_encart" },
    { label: "Prix (€)", key: "support_prix" },
    { label: "Total Facture (€)", key: "montant_total_facture" },
  ];

  if (!isAdmin) return <div>Accès refusé.</div>;

  return (
    <div className="mb-10 animate-in fade-in duration-500">
      <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:items-center mt-10 mb-8">
        <div>
          <p className="font-bold text-lg text-[#3F3F3F] leading-3">Statistiques des supports</p>
          <p className="text-[#3F3F3F] opacity-80 mt-2">Vue d'ensemble et rentabilité</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="px-3 py-2 bg-white border border-[#E1E1E1] rounded-md text-[#3F3F3F] text-sm focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]">
            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
            <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
            <option value="rolling">12 derniers mois</option>
          </select>
          <label className="flex items-center justify-between gap-4 px-3 py-2 bg-white border border-[#E1E1E1] rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
            <span className="text-[#3F3F3F] opacity-80 font-medium text-sm">Payées</span>
            <input type="checkbox" checked={paidOnly} onChange={(e) => setPaidOnly(e.target.checked)} className="accent-[#3F3F3F] h-4 w-4"/>
          </label>
          {!isStatsLoading && invoicesForCharts.length > 0 && (
            <CSVLink
              data={csvData}
              headers={csvHeaders}
              filename={"export-statistiques.csv"}
              className="bg-[#3F3F3F] text-white font-semibold py-2 px-4 rounded hover:bg-opacity-80 transition-all w-full md:w-auto text-center text-sm flex items-center justify-center"
              target="_blank"
              separator={";"} 
            >
              Export CSV
            </CSVLink>
          )}
        </div>
      </div>

      {isStatsLoading ? (
        <div className="w-full text-center text-[#3F3F3F] opacity-70 py-12">Chargement...</div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="w-full">
            <RevenueGoal allInvoices={invoices} />
          </div>

          <div className="w-full">
            <GlobalStatsCards 
                invoices={invoicesFilteredByDate} 
                charges={chargesFilteredByDate} 
            />
          </div>
          <div className="w-full"><StatChart invoices={invoicesForCharts} supportColorMap={supportColorMap} /></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <PieChartStats invoices={invoicesForCharts} supportColorMap={supportColorMap} />
            <TopClients invoices={invoicesFilteredByDate} />
          </div>
        </div>
      )}
      
      <div className="mt-16 mb-6">
         <p className="font-bold text-lg text-[#3F3F3F] leading-3">Statistiques par support</p>
      </div>
      <YearlySupportStats invoices={invoicesFilteredByDate} />
    </div>
  );
};

export default Stats;