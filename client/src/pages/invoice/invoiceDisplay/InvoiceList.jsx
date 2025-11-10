import "./invoice.css";
import { useState } from "react";
import { formatDateSlash } from "../../../utils/formatDate";
import axios from "axios";

const InvoiceList = ({ invoices, setInvoices }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadingInvoices, setDownloadingInvoices] = useState([]); // Pour suivre les factures en téléchargement
  const invoicesPerPage = 10;

  const totalPages = Math.ceil(invoices.length / invoicesPerPage);

  const startIndex = (currentPage - 1) * invoicesPerPage;
  const currentInvoices = invoices.slice(
    startIndex,
    startIndex + invoicesPerPage
  );

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDownload = async (id) => {
    setDownloadingInvoices((prev) => [...prev, id]);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_HOST}/api/invoice/pdf/${id}`,
        { responseType: "blob" }
      );

      const blob = await response.data;
      const url = window.URL.createObjectURL(blob);
      window.open(url);
    } catch (error) {
      console.error("Erreur lors du téléchargement :", error);
    } finally {
      setDownloadingInvoices((prev) =>
        prev.filter((invoiceId) => invoiceId !== id)
      );
    }
  };

  
  const handleValidate = (id) => {
    const isConfirmed = window.confirm("Voulez-vous confirmer le paiement de cette commande ?");
    if (!isConfirmed) {
      // Si l'utilisateur clique sur "Annuler", on ne fait rien
      return;
    }
    axios
      .post(`${import.meta.env.VITE_API_HOST}/api/invoice/validate/${id}`)
      .then((response) => {
        setInvoices((prevInvoices) => {
          return prevInvoices.map((invoice) => {
            if (invoice._id === id) {
              return { ...invoice, status: "paid" };
            } else {
              return invoice;
            }
          });
        });
      })
      .catch((error) => {
        console.error("Erreur lors de la validation :", error);
      });
  };

  return (
    <div>
      <table
        className="w-full text-[#3F3F3F] mt-5 invoice-table"
        cellSpacing={10}
      >
        <thead className="!font-normal bg-black rounded bg-opacity-10">
          <tr>
            <th>Numéro de facture</th>
            <th>Client</th>
            <th>Status</th>
            <th className="table-cell-padding">Date de création</th>
            <th className="table-cell-padding">Montant</th>
            <th className="table-cell-padding">Action</th>
          </tr>
        </thead>
        <tbody>
          {currentInvoices.map((invoice) => (
            <tr key={invoice._id} className="text-center font-medium text-sm">
              <td className="table-cell-padding cursor-pointer text-[#3399CC] text-center ">
                {invoice.number.toString().padStart(5, "0") +
                  "-" +
                  invoice.entreprise.toUpperCase()}
              </td>
              <td className="table-cell-padding">{invoice.entreprise}</td>
              <td className="table-cell-padding">
                <div className="flex items-center justify-center space-x-2">
                  <span className={`h-2 w-2 rounded-full ${
                    invoice.status === 'paid' ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  <span>{invoice.status === "paid" ? "Payé" : "Non Payé"}</span>
                </div>
              </td>
              <td className="table-cell-padding">
                {formatDateSlash(invoice.date)}
              </td>
              <td className="table-cell-padding">{invoice.totalPrice} €</td>
              <td className="table-cell-padding flex justify-center">
                {downloadingInvoices.includes(invoice._id) ? (
                  <svg
                    aria-hidden="true"
                    className="inline w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                ) : (
                  <svg
                    className="size-5 fill-[#3F3F3F] cursor-pointer"
                    viewBox="0 -960 960 960"
                    onClick={() => {
                      handleDownload(invoice._id);
                    }}
                  >
                    <path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" />
                  </svg>
                )}

                {invoice.status !== "paid" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 -960 960 960"
                    className="size-5 fill-[#3F3F3F] cursor-pointer"
                    onClick={() => handleValidate(invoice._id)}
                  >
                    <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" />
                  </svg>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center mt-4">
        <button
          className="px-4 py-2 bg-[#3F3F3F] rounded-l text-white text-sm cursor-pointer"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Précédent
        </button>
        <span className="px-4 py-2 text text-black">
          Page {currentPage} sur {totalPages}
        </span>
        <button
          className="px-4 py-2 bg-[#3F3F3F] rounded-r text-white text-sm cursor-pointer"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default InvoiceList;
