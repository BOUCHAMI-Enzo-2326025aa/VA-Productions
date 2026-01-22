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
import OrderEditModal from "./OrderEditModal";
import PageHeader from "../../components/PageHeader";
import EditableText from "../../components/EditableText";
import useAuth from "../../hooks/useAuth";

const readStoredValue = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw;
  } catch {
    return fallback;
  }
};

const Order = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersToShow, setOrdersToShow] = useState([]);
  const [statusToShow, setStatusToShow] = useState("pending");
  const [selectedOrder, setSelectedOrder] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [orderBeingEdited, setOrderBeingEdited] = useState(null);
  const [pendingLabel, setPendingLabel] = useState(() =>
    readStoredValue("orders:status:pending", "En attentes")
  );
  const [approvedLabel, setApprovedLabel] = useState(() =>
    readStoredValue("orders:status:approved", "Validés")
  );
  const [cancelLabel, setCancelLabel] = useState(() =>
    readStoredValue("orders:status:cancel", "Annulés")
  );
  const [actionLabel, setActionLabel] = useState(() =>
    readStoredValue("orders:action:label", "Action")
  );
  const [createLabel, setCreateLabel] = useState(() =>
    readStoredValue("orders:create:label", "Créer une commande")
  );

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

      const contentDisposition =
        response.headers["content-disposition"] ||
        response.headers["Content-Disposition"];
      let filename = orderNumber ? `commande-${orderNumber}.pdf` : `commande-${id}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?"?([^";]*)"?/i);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1]);
        }
      }

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error("Erreur lors du téléchargement du PDF:", error);
    }
  };

  const uploadSignedPdf = async (orderId, file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      await axios.post(
        `${import.meta.env.VITE_API_HOST}/api/order/${orderId}/signed-pdf`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      await fetchOrders();
    } catch (error) {
      console.error("Erreur lors de l'upload du bon signé:", error);
      alert(
        error?.response?.data?.error ||
          "Erreur lors de l'upload du bon signé."
      );
    }
  };

  const validateOrder = async () => {
    setValidationError("");
    setIsValidating("pending");
    try {
      await axios.post(import.meta.env.VITE_API_HOST + "/api/order/validate", {
        orders: selectedOrder,
      });
      await fetchOrders();
      setIsValidating("finished");
    } catch (error) {
      const apiError = error?.response?.data?.error;
      const blockedOrders = error?.response?.data?.blockedOrders;
      const blockedNumbers = Array.isArray(blockedOrders)
        ? blockedOrders
            .map((o) => o?.orderNumber)
            .filter((n) => n !== undefined && n !== null)
        : [];

      const details = blockedNumbers.length
        ? `N° de Commandes non signées : ${blockedNumbers.join(", ")}`
        : "";

      const message = apiError
        ? `${apiError}${details ? `\n${details}` : ""}`
        : "Erreur lors de la validation des commandes.";

      setValidationError(message);
      setIsValidating("error");
    }
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

  useEffect(() => {
    if (!isAdmin) {
      setIsEditing(false);
    }
  }, [isAdmin]);

  return (
    <div className="text-[#3F3F3F]">
      {isValidating != false && (
        <OrderValidationModal
          loading={isValidating}
          error={validationError}
          onClose={() => {
            setIsValidating(false);
            setValidationError("");
          }}
        />
      )}
      {isCancelling != false && <OrderDeleteModal loading={isCancelling} />}
      <PageHeader
        title="Bons de commandes créés"
        description="Voici la liste de tous les bons des commandes créés (en cours et validés)"
        storageKey="page-header:commandes"
        className="mt-10"
        editMode={isEditing}
        onEditModeChange={setIsEditing}
        canEdit={isAdmin}
      />

      <div className="flex justify-between w-full items-center order-actions-container">
        <ChangeStatusButton
          statusToShow={statusToShow}
          setStatusToShow={setStatusToShow}
          isEditing={isEditing && isAdmin}
          pendingLabel={pendingLabel}
          approvedLabel={approvedLabel}
          cancelLabel={cancelLabel}
          onPendingLabelChange={setPendingLabel}
          onApprovedLabelChange={setApprovedLabel}
          onCancelLabelChange={setCancelLabel}
        />
        <div className="flex gap-2 h-full ">
          <ActionButton
            selectedOrder={selectedOrder}
            validateOrder={validateOrder}
            cancelOrder={cancelOrder}
            isEditing={isEditing && isAdmin}
            label={actionLabel}
            onLabelChange={setActionLabel}
          />
          {isEditing && isAdmin ? (
            <EditableText
              storageKey="orders:create:label"
              defaultValue={createLabel}
              isEditing={isEditing}
              inputBaseClassName="bg-[#3F3F3F] text-white px-4 py-3 rounded-sm font-medium font-inter w-full sm:w-[275px]"
              inputClassName="text-white font-medium font-inter text-center"
              onValueChange={setCreateLabel}
            />
          ) : (
            <InvoiceButton
              className={"!h-full text-sm"}
              value={createLabel}
              onClickFunction={() => (location.href = "/invoice/create")}
            />
          )}
        </div>
      </div>

      <div className="flex items-start mt-5 gap-3 order-content-wrapper">
        <div className="bg-white min-h-fit w-[50%] rounded-lg px-6 py-6 flex flex-col gap-2">
          {ordersToShow.map((order, index) => (
            <OrderItem
              key={index}
              order={order}
              fetchCommandPdf={fetchCommandPdf}
              handleSelect={handleSelect}
              selectedOrder={selectedOrder}
              onEdit={setOrderBeingEdited}
              uploadSignedPdf={uploadSignedPdf}
            />
          ))}
        </div>
      </div>
      {orderBeingEdited && (
        <OrderEditModal
          order={orderBeingEdited}
          onClose={() => setOrderBeingEdited(null)}
          refetchOrders={fetchOrders}
        />
      )}
    </div>
  );
};

export default Order;