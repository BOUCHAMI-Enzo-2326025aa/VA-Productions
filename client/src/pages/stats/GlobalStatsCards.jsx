import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import formatPrice from "@/utils/formatPrice";
import { CreditCard, Banknote, Trophy, TrendingUp, TrendingDown } from "lucide-react";

const GlobalStatsCards = ({ invoices, charges = [] }) => {
  const stats = useMemo(() => {
    // 1. Chiffre d'Affaires (Somme des factures)
    const totalRevenue = invoices.reduce((acc, inv) => acc + inv.totalPrice, 0);

    // 2. Total des Charges (Somme des montantResultat)
    // On additionne uniquement les montants positifs
    const totalCharges = charges.reduce((acc, charge) => {
        const val = charge.montantResultat || 0;
        return acc + val;
    }, 0);

    // 3. Bénéfice (Revenue - Charges)
    const profit = totalRevenue - totalCharges;

    // 4. Panier moyen
    const count = invoices.length;
    const averageBasket = count > 0 ? totalRevenue / count : 0;
    
    // 5. Meilleur Mois
    const monthMap = {};
    invoices.forEach(inv => {
      const d = new Date(inv.date);
      const key = `${d.getMonth()}-${d.getFullYear()}`; 
      if (!monthMap[key]) monthMap[key] = { total: 0, date: d };
      monthMap[key].total += inv.totalPrice;
    });

    let bestMonthVal = 0;
    let bestMonthName = "-";
    Object.values(monthMap).forEach(m => {
        if (m.total > bestMonthVal) {
            bestMonthVal = m.total;
            bestMonthName = m.date.toLocaleDateString("fr-FR", { month: 'long', year: 'numeric' });
        }
    });
    if (bestMonthName !== "-") bestMonthName = bestMonthName.charAt(0).toUpperCase() + bestMonthName.slice(1);

    return { totalRevenue, totalCharges, profit, averageBasket, bestMonthVal, bestMonthName };
  }, [invoices, charges]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full mb-6">
      
      {/* 1. CA */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">Revenu total</p>
        </CardContent>
      </Card>

      {/* 2. BÉNÉFICE (Nouveau) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bénéfice</CardTitle>
          {stats.profit >= 0 ? (
             <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
             <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPrice(stats.profit)}
          </div>
          <p className="text-xs text-muted-foreground">
             Charges déduites : {formatPrice(stats.totalCharges)}
          </p>
        </CardContent>
      </Card>

      {/* 3. Meilleur Mois */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Meilleur Mois</CardTitle>
          <Trophy className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPrice(stats.bestMonthVal)}</div>
          <p className="text-xs text-muted-foreground">{stats.bestMonthName}</p>
        </CardContent>
      </Card>

      {/* 4. Panier Moyen */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Panier Moyen</CardTitle>
          <CreditCard className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPrice(stats.averageBasket)}</div>
          <p className="text-xs text-muted-foreground">Par commande</p>
        </CardContent>
      </Card>

    </div>
  );
};

export default GlobalStatsCards;