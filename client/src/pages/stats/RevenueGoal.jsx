import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Check, Settings2, X, Calendar, ArrowRight } from "lucide-react";
import formatPrice from "@/utils/formatPrice";

const OPTIONS = [
  { value: "this_year", label: `Année en cours (${new Date().getFullYear()})` },
  { value: "this_quarter", label: "Ce Trimestre" },
  { value: "this_month", label: "Ce Mois-ci" },
  { value: "custom", label: "📅 Période Personnalisée" }, 
];

const RevenueGoal = ({ allInvoices = [] }) => {
  const [target, setTarget] = useState(() => {
    const saved = localStorage.getItem("revenueGoal_amount");
    return saved ? parseFloat(saved) : 50000;
  });

  const [period, setPeriod] = useState(() => {
    return localStorage.getItem("revenueGoal_period") || "this_year";
  });

  // Dates personnalisées (sauvegardées aussi)
  const [customStart, setCustomStart] = useState(() => {
    return localStorage.getItem("revenueGoal_start") || "";
  });
  const [customEnd, setCustomEnd] = useState(() => {
    return localStorage.getItem("revenueGoal_end") || "";
  });

  // États d'édition temporaires
  const [isEditing, setIsEditing] = useState(false);
  const [inputTarget, setInputTarget] = useState(target);
  const [inputPeriod, setInputPeriod] = useState(period);
  const [inputCustomStart, setInputCustomStart] = useState(customStart);
  const [inputCustomEnd, setInputCustomEnd] = useState(customEnd);

  const { currentRevenue, label } = useMemo(() => {
    if (!allInvoices || !Array.isArray(allInvoices)) return { currentRevenue: 0, label: "" };

    const now = new Date();
    let startDate = new Date();
    let endDate = new Date(); // Par défaut aujourd'hui

    // Définir les dates selon la période
    if (period === "this_year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    } 
    else if (period === "this_quarter") {
      const currentQuarterMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), currentQuarterMonth, 1);
    } 
    else if (period === "this_month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } 
    else if (period === "custom") {
      // Gestion des dates manuelles
      if (customStart) startDate = new Date(customStart);
      if (customEnd) {
         endDate = new Date(customEnd);
         // On met la fin de journée pour inclure les factures du jour même
         endDate.setHours(23, 59, 59, 999);
      }
    }

    const total = allInvoices
      .filter((inv) => {
        if (!inv.date) return false;
        const s = inv.status || "";
        if (s === "cancelled" || s === "draft") return false;

        const d = new Date(inv.date);
        if (isNaN(d.getTime())) return false;
        
        return d >= startDate && d <= endDate;
      })
      .reduce((acc, inv) => acc + (Number(inv.totalPrice) || 0), 0);

    let displayLabel = OPTIONS.find(o => o.value === period)?.label || "";
    if (period === "custom" && customStart && customEnd) {
      displayLabel = `Du ${new Date(customStart).toLocaleDateString()} au ${new Date(customEnd).toLocaleDateString()}`;
    }

    return { currentRevenue: total, label: displayLabel };
  }, [allInvoices, period, customStart, customEnd]);

  const handleSave = () => {
    const newTarget = parseFloat(inputTarget) || 0;
    
    setTarget(newTarget);
    setPeriod(inputPeriod);
    setCustomStart(inputCustomStart);
    setCustomEnd(inputCustomEnd);

    localStorage.setItem("revenueGoal_amount", newTarget);
    localStorage.setItem("revenueGoal_period", inputPeriod);
    
    if (inputPeriod === "custom") {
      localStorage.setItem("revenueGoal_start", inputCustomStart);
      localStorage.setItem("revenueGoal_end", inputCustomEnd);
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    setInputTarget(target);
    setInputPeriod(period);
    setInputCustomStart(customStart);
    setInputCustomEnd(customEnd);
    setIsEditing(false);
  };

  const safeTarget = target > 0 ? target : 1;
  const percentage = Math.min((currentRevenue / safeTarget) * 100, 100);
  const diff = target - currentRevenue;

  return (
    <Card className="w-full mb-6 border-l-4 border-l-blue-600 bg-white shadow-sm transition-all duration-300">
      <CardHeader className="pb-2 pt-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-full text-blue-700">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-gray-800">
              Objectif de Chiffre d'Affaires
            </CardTitle>
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {label || "Période non définie"}
            </p>
          </div>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <Settings2 className="h-4 w-4" />
            Modifier
          </button>
        )}
      </CardHeader>

      <CardContent>
        {isEditing ? (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Montant à atteindre (€)</label>
                <input
                  type="number"
                  value={inputTarget}
                  onChange={(e) => setInputTarget(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-gray-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Type de Période</label>
                <select
                  value={inputPeriod}
                  onChange={(e) => setInputPeriod(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-gray-700"
                >
                  {OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {inputPeriod === "custom" && (
                <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-white p-3 rounded border border-blue-100">
                  <div>
                    <label className="text-xs font-semibold text-blue-600 uppercase">Du :</label>
                    <input 
                      type="date" 
                      value={inputCustomStart}
                      onChange={(e) => setInputCustomStart(e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-blue-600 uppercase">Au :</label>
                    <input 
                      type="date" 
                      value={inputCustomEnd}
                      onChange={(e) => setInputCustomEnd(e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              )}

            </div>
            <div className="flex justify-end gap-2">
              <button onClick={handleCancel} className="flex items-center gap-1 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 rounded transition">
                <X className="h-4 w-4" /> Annuler
              </button>
              <button onClick={handleSave} className="flex items-center gap-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition shadow-sm">
                <Check className="h-4 w-4" /> Valider
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-end mb-2 mt-1">
              <div>
                <span className="text-3xl font-extrabold text-blue-700 tracking-tight">
                  {formatPrice(currentRevenue)}
                </span>
                <span className="text-sm text-gray-500 font-medium ml-2">
                  réalisés sur {formatPrice(target)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-blue-700">
                  {isNaN(percentage) ? "0.0" : percentage.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-1000 ease-out ${
                  percentage >= 100 ? "bg-green-500" : "bg-blue-600"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            <p className="text-xs text-gray-500 mt-2 font-medium">
              {percentage >= 100 ? (
                <span className="text-green-600 flex items-center gap-1">
                  🎉 Objectif atteint ! Excellent travail.
                </span>
              ) : (
                <span>
                   Encore <span className="font-bold text-gray-700">{formatPrice(diff)}</span> pour atteindre votre objectif.
                </span>
              )}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RevenueGoal;