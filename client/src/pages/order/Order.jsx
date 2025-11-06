import axios from "axios";
import { useEffect } from "react";
import { useState } from "react";
import OrderItem from "./OrderItem";
import "./order.css";
import ChangeStatusButton from "./ChangeStatusButton";
import ActionButton from "./ActionButton";
import InvoiceButton from "../invoice/component/InvoiceButton";
import OrderValidationModal from "./OrderValidationModal";
import OrderDeleteModal from "./OrderDeleteModal";

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [ordersToShow, setOrdersToShow] = useState([]);
  const [statusToShow, setStatusToShow] = useState("pending");
  const [selectedOrder, setSelectedOrder] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchOrders = async () => {
    await axios
      .get(import.meta.env.VITE_API_HOST + "/api/order")
      .then((response) => {
        setOrders(response.data);
        filterOrders();
        setIsLoading(false);
      });
    setSelectedOrder([]);
  };

  const filterOrders = () => {
    if (statusToShow === "pending") {
      setOrdersToShow(
        orders.filter((order) => order.status.toLowerCase() === "pending")
      );
    } else if (statusToShow === "approved") {
      setOrdersToShow(
        orders.filter((order) => order.status.toLowerCase() === "validated")
      );
    } else if (statusToShow === "cancel") {
      setOrdersToShow(
        orders.filter((order) => order.status.toLowerCase() === "cancel")
      );
    }
  };

  useEffect(() => {
    filterOrders();
  }, [statusToShow, orders]);

  const handleSelect = (order) => {
    if (selectedOrder.includes(order)) {
      setSelectedOrder(selectedOrder.filter((orderId) => orderId !== order));
    } else {
      setSelectedOrder([...selectedOrder, order]);
    }
  };

  const fetchCommandPdf = async (id, orderNumber) => {
    try {
      const response = await axios.get(
        import.meta.env.VITE_API_HOST + "/api/order/pdf/" + id,
        { responseType: "blob" }
      );

  // récupération du nom de fichier depuis l'en-tête Content-Disposition
      const contentDisposition =
        response.headers["content-disposition"] ||
        response.headers["Content-Disposition"];
    // privilégie orderNumber pour le nom de fichier
    let filename = orderNumber ? `commande-${orderNumber}.pdf` : `commande-${id}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^";]*)"?/i);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1]);
        }
      }

  const blob = new Blob([response.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  // Ouvrir le PDF dans un nouvel onglet pour prévisualisation 
  window.open(url, "_blank");
  // Révoquer l'URL après un court délai pour laisser le navigateur charger le PDF
  setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error("Erreur lors du téléchargement du PDF:", error);
    }
  };

  const validateOrder = async () => {
    setIsValidating("pending");
    await axios
      .post(import.meta.env.VITE_API_HOST + "/api/order/validate", {
        orders: selectedOrder,
      })
      .then((response) => {
        fetchOrders();
        setIsValidating("finished");
      });
  };

  const cancelOrder = async () => {
    setIsCancelling("pending");
    await axios
      .post(import.meta.env.VITE_API_HOST + "/api/order/cancel", {
        orders: selectedOrder,
      })
      .then((response) => {
        fetchOrders();
        setOrders(orders.filter((order) => order.status !== "cancel"));
        setIsCancelling("finished");
      });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="text-[#3F3F3F]">
      {isValidating != false && <OrderValidationModal loading={isValidating} />}
      {isCancelling != false && <OrderDeleteModal loading={isCancelling} />}
      <p className="font-semibold text-lg mt-10">Bon de commandes crées</p>
      <p className=" opacity-80">
        Voici la liste de tous les bons des commandes crées (en cours et
        validés)
      </p>

      <div className="flex justify-between w-full items-center ">
        <ChangeStatusButton
          statusToShow={statusToShow}
          setStatusToShow={setStatusToShow}
        />
        <div className="flex gap-2 h-full ">
          <ActionButton
            selectedOrder={selectedOrder}
            validateOrder={validateOrder}
            cancelOrder={cancelOrder}
          />
          <InvoiceButton
            className={"!h-full text-sm"}
            value={"Créer une commande"}
            onClickFunction={() => (location.href = "/invoice/create")}
          />
        </div>
      </div>

      <div className="flex items-start mt-5 gap-3">
        <div className="bg-white min-h-fit w-[50%] rounded-lg px-6 py-6 flex flex-col gap-2">
          {ordersToShow.map((order, index) => (
            <OrderItem
              key={index}
              order={order}
              fetchCommandPdf={fetchCommandPdf}
              handleSelect={handleSelect}
              selectedOrder={selectedOrder}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Order;
