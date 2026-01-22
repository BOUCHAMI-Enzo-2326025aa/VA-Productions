import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import formatPrice from "@/utils/formatPrice";

const TopClients = ({ invoices }) => {
  const topClients = useMemo(() => {
    const clientMap = {};

    invoices.forEach((inv) => {
      // On normalise le nom pour éviter les doublons type "Client A" et "client a"
      const name = inv.entreprise || "Inconnu";
      if (!clientMap[name]) {
        clientMap[name] = { name, total: 0, count: 0 };
      }
      clientMap[name].total += inv.totalPrice;
      clientMap[name].count += 1;
    });

    return Object.values(clientMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5); // Top 5
  }, [invoices]);

  return (
    <Card className="flex flex-col w-full h-full">
      <CardHeader>
        <CardTitle>Meilleurs Clients</CardTitle>
        <CardDescription>Top 5 par chiffre d'affaires</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {topClients.map((client, index) => (
          <div key={index} className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 font-bold text-slate-700">
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-medium leading-none truncate w-[120px] sm:w-auto">
                    {client.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {client.count} facture{client.count > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="font-bold">{formatPrice(client.total)}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default TopClients;