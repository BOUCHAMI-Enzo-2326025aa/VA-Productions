import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import axios from "axios";
import EditableText from "../../../components/EditableText";

export const description = "An interactive bar chart";

const readStoredValue = (key, fallback) => {
  if (!key) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw;
  } catch {
    return fallback;
  }
};

export function ClientChart({ isEditing = false }) {
  const [activeChart, setActiveChart] = React.useState("event");
  const [chartData, setChartData] = React.useState([]);
  const [eventList, setEventList] = React.useState([]);
  const [invoiceList, setInvoiceList] = React.useState([]);
  const [eventLabel, setEventLabel] = React.useState(() =>
    readStoredValue("dashboard:chart:event-label", "Prospects")
  );
  const [invoiceLabel, setInvoiceLabel] = React.useState(() =>
    readStoredValue("dashboard:chart:invoice-label", "Clients")
  );
  const [metricLabel, setMetricLabel] = React.useState(() =>
    readStoredValue("dashboard:chart:metric-label", "Nombre")
  );

  const chartConfig = React.useMemo(
    () => ({
      views: {
        label: metricLabel,
      },
      event: {
        label: eventLabel,
        color: "#5C89E0",
      },
      invoice: {
        label: invoiceLabel,
        color: "#D79C45",
      },
    }),
    [metricLabel, eventLabel, invoiceLabel]
  );

  const total = React.useMemo(
    () => ({
      event: chartData.reduce((acc, curr) => acc + curr.event, 0),
      invoice: chartData.reduce((acc, curr) => acc + curr.invoice, 0),
    }),
    [chartData]
  );

  const conversionRate = React.useMemo(() => {
    if (total.event === 0) return 0;
    return ((total.invoice / total.event) * 100).toFixed(2);
  }, [total]);

  const fetchEvents = async () => {
    await axios
      .get(import.meta.env.VITE_API_HOST + "/api/events")
      .then((res) => {
        setEventList(res.data);
      });
  };

  const fetchInvoices = async () => {
    await axios
      .get(import.meta.env.VITE_API_HOST + "/api/invoice/")
      .then((res) => {
        setInvoiceList(res.data);
      });
  };

  const createChartData = () => {
    const today = new Date();
    const dateCount = {};

    // Helper function to get all dates for the last 30 days
    const getLast30Days = () => {
      const dates = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toLocaleDateString("en-CA"));
      }
      return dates.reverse(); // Optional: Reverse to have oldest date first
    };

    // Helper function to check if a date is within the last 30 days
    const isWithinLast30Days = (date) => {
      const diffTime = today - new Date(date);
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays <= 30;
    };

    // Process eventList
    eventList.forEach((event) => {
      const eventDate = new Date(event.startTime).toLocaleDateString("en-CA");
      if (isWithinLast30Days(event.startTime)) {
        if (!dateCount[eventDate]) {
          dateCount[eventDate] = { event: 0, invoice: 0 };
        }
        dateCount[eventDate].event += 1;
      }
    });

    // Process invoiceList
    invoiceList.forEach((invoice) => {
      const invoiceDate = new Date(invoice.date).toLocaleDateString("en-CA");
      if (isWithinLast30Days(invoice.date)) {
        if (!dateCount[invoiceDate]) {
          dateCount[invoiceDate] = { event: 0, invoice: 0 };
        }
        dateCount[invoiceDate].invoice += 1;
      }
    });

    // Generate data for all 30 days
    const last30Days = getLast30Days();
    const chartData = last30Days.map((date) => ({
      date: date,
      event: dateCount[date]?.event || 0, // Default to 0 if no data
      invoice: dateCount[date]?.invoice || 0, // Default to 0 if no data
    }));

    setChartData(chartData);
  };

  React.useEffect(() => {
    fetchEvents();
    fetchInvoices();
  }, []);

  React.useEffect(() => {
    if (eventList.length > 0 && invoiceList.length > 0) {
      createChartData();
    }
  }, [eventList, invoiceList]);

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>
            <EditableText
              storageKey="dashboard:chart:title"
              defaultValue="Statistiques sur la prospection"
              isEditing={isEditing}
              inputClassName="text-2xl font-semibold"
              as="span"
            />
          </CardTitle>
          <CardDescription>
            <EditableText
              storageKey="dashboard:chart:subtitle"
              defaultValue="Au cours des 30 derniers jours"
              isEditing={isEditing}
              inputClassName="text-sm"
              as="span"
            />
          </CardDescription>
        </div>

        <div className="flex">
          {["event", "invoice"].map((key) => {
            const chart = key;
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  <EditableText
                    storageKey={
                      chart === "event"
                        ? "dashboard:chart:event-label"
                        : "dashboard:chart:invoice-label"
                    }
                    defaultValue={chartConfig[chart].label}
                    isEditing={isEditing}
                    inputClassName="text-xs"
                    onValueChange={
                      chart === "event" ? setEventLabel : setInvoiceLabel
                    }
                    as="span"
                  />
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {total[chart].toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />

            <Bar dataKey={activeChart} fill={chartConfig[activeChart].color} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="py-0 w-full flex justify-end">
          <span className="text-sm font-semibold">
            <EditableText
              storageKey="dashboard:chart:conversion-label"
              defaultValue="Taux de conversion:"
              isEditing={isEditing}
              inputClassName="text-sm font-semibold"
              as="span"
            />
          </span>
          <span className="ml-2 text-sm font-bold">{conversionRate}%</span>
        </div>
      </CardFooter>
    </Card>
  );
}
