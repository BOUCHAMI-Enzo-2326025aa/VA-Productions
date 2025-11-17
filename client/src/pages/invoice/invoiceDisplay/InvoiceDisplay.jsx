import { useEffect, useState } from "react";
import InvoiceButton from "../component/InvoiceButton";
import InvoiceList from "./InvoiceList";
import InvoiceNumbers from "./invoiceNumbers/InvoiceNumbers";
import axios from "axios";
import FilterModal from "./FilterModal";

const InvoiceDisplay = () => {
  const [magazineList, setMagazineList] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [invoicesToShow, setInvoicesToShow] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [clientList, setClientList] = useState([]);
  const [filter, setFilter] = useState({
    support: [],
    compagnies: [],
    start: "",
    end: "",
    status: [],
  });

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      // On récupère toutes les factures
      const invoicesResponse = await axios.get(import.meta.env.VITE_API_HOST + "/api/invoice");
      // On récupère seulement les factures en retard
      const overdueResponse = await axios.get(import.meta.env.VITE_API_HOST + "/api/invoice/overdue");
      const allInvoices = invoicesResponse.data;
      const overdueIds = new Set(overdueResponse.data.map(inv => inv._id));
      const invoicesWithStatus = allInvoices.map(invoice => ({
        ...invoice,
        isOverdue: overdueIds.has(invoice._id)
      }));
      
      // On trie pour mettre les factures en retard en haut de la liste
      invoicesWithStatus.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return new Date(b.date) - new Date(a.date); 
      });

      setInvoices(invoicesWithStatus);
      setInvoicesToShow(invoicesWithStatus);

    } catch (error) {
      console.error("Erreur lors de la récupération des factures :", error);
    } finally {
      setIsLoading(false);
    }
  };


  const fetchAllClients = async () => {
    axios
      .get(import.meta.env.VITE_API_HOST + "/api/invoice/compagnies")
      .then((res) => setClientList(res.data));
  };

  const searchInvoice = (search) => {
    if (search === "") {
      setInvoicesToShow(invoices);
    } else {
      const searchResult = invoices.filter((invoice) => {
        return invoice.entreprise.toLowerCase().includes(search.toLowerCase());
      });
      setInvoicesToShow(searchResult);
    }
  };

  const fetchAllMagazines = async () => {
    try {
      const response = await axios.get(import.meta.env.VITE_API_HOST + "/api/magazine/");
      const magazineNames = response.data.magazines.map(mag => mag.nom);
      setMagazineList(magazineNames);
    } catch (error) {
      console.error("Erreur lors de la récupération des magazines :", error);
    }
  };

  const filterInvoices = () => {
    setIsFilterOpen(false);
    
    const { start, end, status, support, compagnies } = filter;

    const filteredInvoices = invoices.filter((invoice) => {
      const dateMatch = (start === "" || new Date(invoice.date) >= start) && (end === "" || new Date(invoice.date) <= end);
      if (!dateMatch) return false;
      const supportMatch = support.length === 0 || invoice.supportList.some((s) => support.includes(s.supportName));
      if (!supportMatch) return false;
      const companyMatch = compagnies.length === 0 || compagnies.includes(invoice.entreprise);
      if (!companyMatch) return false;

      if (status.length > 0) {
        const wantsPaid = status.includes("paid");
        const wantsUnpaid = status.includes("unpaid");
        const wantsOverdue = status.includes("overdue");

        if (invoice.status === 'paid') {
          return wantsPaid; 
        }

        if (invoice.status === 'unpaid') {
          if (invoice.isOverdue) {
            // facture "Impayé"
            return wantsOverdue; 
          } else {
            // facture "Non Payé" (dans les temps)
            return wantsUnpaid;
          }
        }
      }
      return true;
    });

    setInvoicesToShow(filteredInvoices);
  };

  const updateFilter = (key, value) => {
    setFilter((prevFilter) => ({
      ...prevFilter,
      [key]: value,
    }));
  };

  const deleteFilter = () => {
    setFilter({ support: [], compagnies: [], start: "", end: "", status: [] });
    setInvoicesToShow(invoices); 
    setIsFilterOpen(false);
  };

  useEffect(() => {
    fetchInvoices();
    fetchAllClients();
    fetchAllMagazines();
  }, []);

  return (
    <div>
      {isFilterOpen && (
        <div
          className="absolute left-0 top-0 bg-black opacity-50 w-screen h-screen z-10 bg-appear-animation"
          onClick={() => setIsFilterOpen(false)}
        ></div>
      )}
      <InvoiceNumbers invoices={invoicesToShow} isLoading={isLoading} />

      <div className="text-[#3F3F3F] mt-10 ">
        <p className="font-semibold">Liste des factures</p>
        <p className="text-sm">Voici la liste de toutes les factures crées !</p>
      </div>

      <div className="flex items-center h-10 mt-5 gap-2 justify-between relative">
        <div className="flex items-center rounded-md px-2 h-full bg-white min-w-[500px]">
          <svg className="size-5 fill-[#3F3F3F]" viewBox="0 -960 960 960">
            <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
          </svg>
          <input
            onChange={(e) => searchInvoice(e.target.value)}
            placeholder="Rechercher un client"
            className="bg-transparent h-full w-full py-2  text-[#3F3F3F] text-sm px-2"
          ></input>
        </div>

        <InvoiceButton
          value={"Filtrer"}
          className={"!h-full !py-0 mr-auto text-sm w-[170px]"}
          onClickFunction={() => setIsFilterOpen(!isFilterOpen)}
        />

        {isFilterOpen && (
          <FilterModal
            filter={filter}
            setFilter={updateFilter}
            clientList={clientList}
            magazineList={magazineList}
            filterInvoiceAction={filterInvoices}
            deleteFilter={deleteFilter}
          />
        )}

        {/*<div className="flex h-full gap-1">
          <ExportInvoiceButton />
      </div>*/}
      </div>
      <InvoiceList invoices={invoicesToShow} setInvoices={setInvoices} />
    </div>
  );
};

export default InvoiceDisplay;
