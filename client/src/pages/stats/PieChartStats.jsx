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
import formatPrice from "@/utils/formatPrice";
import { getSupportColor } from "./supportColorMap";
export function PieChartStats({ invoices, supportColorMap }) {
const supportList = useMemo(() => {
return [
...new Set(
invoices.flatMap((invoice) =>
invoice.supportList.map((support) => support.supportName)
)
),
];
}, [invoices]);
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
.map((item) => ({
...item,
fill: getSupportColor(item.supportName, supportColorMap),
}));
const chartConfig = {
support: {
label: "Support",
},
price: {
label: "Revenues",
},
};
return (
<Card className="flex flex-col w-full lg:w-[35%]">
<CardHeader className="items-center pb-0 ">
<CardTitle>Répartition des revenus</CardTitle>
<CardDescription>12 Derniers mois</CardDescription>
</CardHeader>
<CardContent className="flex-1 pb-0 w-full">
<ChartContainer
config={chartConfig}
className="mx-auto aspect-square max-h-[100%] h-[290px] pb-0 [&_.recharts-pie-label-text]:fill-foreground">
<PieChart>
<ChartTooltip
  content={
    <ChartTooltipContent
      hideLabel
      formatter={(value, name, item) => (
        <div className="flex flex-1 justify-between leading-none items-center">
          <span className="text-neutral-500 dark:text-neutral-400">
            {item?.payload?.supportName || name}
          </span>
          <span className="font-mono font-medium tabular-nums text-neutral-950 dark:text-neutral-50">
            {formatPrice(value)}
          </span>
        </div>
      )}
    />
  }
/>
<Pie
data={chartData}
dataKey="price"
nameKey="supportName"
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