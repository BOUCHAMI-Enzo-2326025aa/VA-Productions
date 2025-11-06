import StatChart from "./StatChart";
import PieChartStats from "./PieChartStats";
import { useEffect, useState } from "react";
import axios from "axios";
import YearlySupportStats from "./YearlySupportStats";
import "./stats.css";
import useAuth from "../../hooks/useAuth"; 

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

  if (!isAdmin) {
    return <div>Accès refusé. Vous devez être administrateur pour voir cette page.</div>;
  }

  return (
    <div className="mb-10">
      <p className="font-bold text-lg text-[#3F3F3F] leading-3 mt-10">
        Statistiques des supports
      </p>
      <p className="text-[#3F3F3F] opacity-80">Statistiques des supports</p>
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
