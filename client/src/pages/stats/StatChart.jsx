import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function StatChart({ invoices, colorList }) {
  const [chartData, setChartData] = useState([]);
  const [supportList, setSupportList] = useState([]);
  const [visibleSupports, setVisibleSupports] = useState({});

  const transformData = () => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    const data = months.map((month) => ({ month }));
    const tempSupportList = [];

    invoices.forEach((invoice) => {
      const invoiceDate = new Date(invoice.date);
      const monthIndex = invoiceDate.getMonth();

      invoice.supportList.forEach((item) => {
        const supportName = item.supportName.toLowerCase();
        if (!tempSupportList.includes(supportName)) {
          tempSupportList.push(supportName);
        }

        if (monthIndex !== -1) {
          if (!data[monthIndex][supportName]) {
            data[monthIndex][supportName] = 0;
          }
          data[monthIndex][supportName] += item.price;
        }
      });
    });

    setSupportList(tempSupportList);

    data.forEach((monthData) => {
      tempSupportList.forEach((support) => {
        if (!monthData[support]) {
          monthData[support] = 0;
        }
      });
    });

    setChartData(data);

    setVisibleSupports(
      tempSupportList.reduce((acc, support) => {
        acc[support] = true;
        return acc;
      }, {})
    );
  };

  useEffect(() => {
    if (invoices.length > 0) {
      transformData();
    }
  }, [invoices]);

  const chartConfig = supportList.reduce((config, support, index) => {
    config[support] = {
      label: support.charAt(0).toUpperCase() + support.slice(1),
      color: colorList[index % colorList.length],
    };
    return config;
  }, {});

  const toggleSupportVisibility = (support) => {
    setVisibleSupports((prev) => ({
      ...prev,
      [support]: !prev[support],
    }));
  };

  return (
    <Card className="w-full lg:!w-[65%]">
      <CardHeader>
        <CardTitle>Revenu de chaque support</CardTitle>
        <CardDescription>12 Derniers mois</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

            {supportList.map(
              (support, index) =>
                visibleSupports[support] && (
                  <Line
                    key={support}
                    dataKey={support}
                    type="monotone"
                    stroke={colorList[index % colorList.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                )
            )}
            <YAxis />
          </LineChart>
        </ChartContainer>
      </CardContent>

      <CardFooter>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 w-full">
          {supportList.map((support, index) => (
            <div
              key={support}
              className={`flex items-center space-x-2 cursor-pointer ${
                visibleSupports[support] ? "opacity-100" : "opacity-50"
              }`}
              onClick={() => toggleSupportVisibility(support)}
            >
              <span
                className="w-6 h-2 rounded"
                style={{ backgroundColor: colorList[index] || "#000" }}
              />
              <span>{chartConfig[support]?.label || support}</span>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}

export default StatChart;