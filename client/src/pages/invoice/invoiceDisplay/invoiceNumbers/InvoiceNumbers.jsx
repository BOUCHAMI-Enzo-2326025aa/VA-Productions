import { useEffect, useState } from "react";
import Stat from "./Stat";

const InvoiceNumbers = ({ invoices, isLoading }) => {
  const [invoiceStats, setInvoiceStat] = useState({
    total: { price: 0, count: 0 },
    validated: { price: 0, count: 0 },
    waiting: { price: 0, count: 0 },
    overdue: { price: 0, count: 0 },
  });

  useEffect(() => {
    const total = { price: 0, count: 0 };
    const validated = { price: 0, count: 0 };
    const waiting = { price: 0, count: 0 };
    const overdue = { price: 0, count: 0 };

    invoices.forEach((invoice) => {
      if (!invoice.totalPrice) return;
      total.price += invoice.totalPrice;
      total.count += 1;

      if (invoice.status === "paid") {
        validated.price += invoice.totalPrice;
        validated.count += 1;
      } else {
        if (invoice.isOverdue) {
          overdue.price += invoice.totalPrice;
          overdue.count += 1;
        } else {
          waiting.price += invoice.totalPrice;
          waiting.count += 1;
        }
      }
    });

    setInvoiceStat({ total, validated, waiting, overdue });
  }, [invoices]);

  return (
    <div className=" text-[#3F3F3F] flex flex-wrap mt-10 rounded w-full gap-2"> 
      <Stat
        title={"Factures totales"}
        value={invoiceStats.total.price}
        subtitle={invoiceStats.total.count + " Factures au total"}
        icon={
          <svg className="size-6 fill-[#9368CF]" viewBox="0 -960 960 960">
            <path d="M240-80q-50 0-85-35t-35-85v-120h120v-560l60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60 60 60 60-60v680q0 50-35 85t-85 35H240Zm480-80q17 0 28.5-11.5T760-200v-560H320v440h360v120q0 17 11.5 28.5T720-160ZM360-600v-80h240v80H360Zm0 120v-80h240v80H360Zm320-120q-17 0-28.5-11.5T640-640q0-17 11.5-28.5T680-680q17 0 28.5 11.5T720-640q0 17-11.5 28.5T680-600Zm0 120q-17 0-28.5-11.5T640-520q0-17 11.5-28.5T680-560q17 0 28.5 11.5T720-520q0 17-11.5 28.5T680-480Z" />
          </svg>
        }
        loading={isLoading}
      />
      <Stat
        title={"Factures validées"}
        value={invoiceStats.validated.price}
        subtitle={invoiceStats.validated.count + " Factures au total"}
        icon={
          <svg className="size-6 fill-[#00CE07]" viewBox="0 -960 960 960">
            <path d="m344-60-76-128-144-32 14-148-98-112 98-112-14-148 144-32 76-128 136 58 136-58 76 128 144 32-14 148 98 112-98 112 14 148-144 32-76 128-136-58-136 58Zm94-278 226-226-56-58-170 170-86-84-56 56 142 142Z" />{" "}
          </svg>
        }
        loading={isLoading}
      />
      <Stat
        title={"En attentes"}
        value={invoiceStats.waiting.price}
        subtitle={invoiceStats.waiting.count + " Factures au total"}
        icon={
          <svg className="size-6 fill-[#FFAD14]" viewBox="0 -960 960 960">
            <path d="M320-160h320v-120q0-66-47-113t-113-47q-66 0-113 47t-47 113v120ZM160-80v-80h80v-120q0-61 28.5-114.5T348-480q-51-32-79.5-85.5T240-680v-120h-80v-80h640v80h-80v120q0 61-28.5 114.5T612-480q51 32 79.5 85.5T720-280v120h80v80H160Z" />{" "}
          </svg>
        }
        loading={isLoading}
      />
       <Stat
        title={"Impayés"}
        value={invoiceStats.overdue.price}
        subtitle={invoiceStats.overdue.count + " Factures au total"}
        loading={isLoading}
        bgColor="bg-red-800" 
      />
    </div>
  );
};

export default InvoiceNumbers;
