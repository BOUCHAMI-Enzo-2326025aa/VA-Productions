import { TrendingUp } from "lucide-react";
import { Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useMemo } from "react";

export function PieChartStats({ invoices, colorList }) {
  // Liste des supports uniques
  const supportList = useMemo(() => {
    return [
      ...new Set(
        invoices.flatMap((invoice) =>
          invoice.supportList.map((support) => support.supportName)
        )
      ),
    ];
  }, [invoices]);

  // Préparation des données pour le graphique
  const chartData = invoices
    .flatMap((invoice) => invoice.supportList)
    .reduce((acc, { supportName, price }) => {
      const existing = acc.find((item) => item.supportName === supportName);
      if (existing) {
        existing.price += price;
      } else {
        acc.push({ supportName, price });
      }
      return acc;
    }, [])
    .map((item, index) => ({
      ...item,
      fill: colorList[index % colorList.length],
    }));

  const chartConfig = {
    support: {
      label: "Support",
    },
    price: {
      label: "Revenues",
    },
  };

  // Fonction pour personnaliser les labels
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    price,
  }) => {
    const RADIAN = Math.PI / 180;

    // Calcul des positions
    const radiusInside = innerRadius + (outerRadius - innerRadius) / 2; // Centre du quartier
    const xInside = cx + radiusInside * Math.cos(-midAngle * RADIAN);
    const yInside = cy + radiusInside * Math.sin(-midAngle * RADIAN);

    const radiusOutside = outerRadius + 20; // Extérieur du cercle
    const xOutside = cx + radiusOutside * Math.cos(-midAngle * RADIAN);
    const yOutside = cy + radiusOutside * Math.sin(-midAngle * RADIAN);

    return (
      <>
        {/* Montant à l'intérieur du quartier */}
        <text
          x={xInside}
          y={yInside}
          fill="white"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight="bold"
        >
          €{price.toFixed(2)}
        </text>
        {/* Pourcentage à l'extérieur du quartier */}
        <text
          x={xOutside}
          y={yOutside}
          fill="#000"
          textAnchor={xOutside > cx ? "start" : "end"}
          dominantBaseline="central"
          fontSize={10}
        >
          {(percent * 100).toFixed(0)}%
        </text>
      </>
    );
  };

  return (
    <Card className="flex flex-col w-[35%]">
      <CardHeader className="items-center pb-0 ">
        <CardTitle>Répartition des revenus</CardTitle>
        <CardDescription>12 Derniers mois</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 w-full">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[100%] h-[290px] pb-0 [&_.recharts-pie-label-text]:fill-foreground">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={chartData}
              dataKey="price"
              nameKey="supportName"
              label={renderCustomLabel} // Utilisation du label personnalisé
              isAnimationActive={false}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="grid w-full grid-cols-2 gap-2">
          {chartData.map((item, index) => (
            <div
              key={item.supportName}
              className="flex items-center space-x-2 justify-center"
            >
              <span
                className="w-6 h-2 rounded"
                style={{
                  backgroundColor: item.fill,
                }}
              />
              <span>{item.supportName}</span>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}

export default PieChartStats;
