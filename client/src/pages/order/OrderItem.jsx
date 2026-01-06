import { useMemo, useRef } from "react";
import { AlertTriangle, Eye, Pencil } from "lucide-react";
import { formatDateSlash } from "../../utils/formatDate.js";

const OrderItem = ({ order, fetchCommandPdf, handleSelect, selectedOrder, onEdit, uploadSignedPdf }) => {
  const fileInputRef = useRef(null);
  
  const totalDisplay = useMemo(() => {
    const total = typeof order.totalPrice === "number" ? order.totalPrice : Number(order.totalPrice) || 0;
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(total);
  }, [order.totalPrice]);

  return (
    <div
      className={
        " border-2 border-black border-opacity-10 rounded-lg px-6 transition-all py-4 " +
        (selectedOrder.includes(order) ? "bg-blue-100" : "")
      }
    >
      <div className="flex items-center gap-2">
        {order.status.toLowerCase() === "pending" && (
          <input
            type="checkbox"
            className="mr-2 size-5"
            checked={selectedOrder.includes(order)}
            onChange={() => handleSelect(order)}
          />
        )}
        <p className="font-semibold text-lg">COMMANDE-{order.orderNumber}</p>

        {order.status?.toLowerCase?.() === "pending" && order.isSigned === false && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  uploadSignedPdf?.(order._id, file);
                }
                e.target.value = "";
              }}
            />
            <button
              type="button"
              className="ml-auto text-red-600 text-sm font-semibold cursor-pointer whitespace-nowrap"
              onClick={() => fileInputRef.current?.click?.()}
              title="Ajouter le PDF du bon signé"
              aria-label="Ajouter le PDF du bon signé"
            >
              <AlertTriangle className="size-5" />
            </button>
          </>
        )}
      </div>

      <table className="order-item-table w-full mt-3">
        <tbody>
          <tr>
            <th>Total:</th>
            <td>{totalDisplay} €</td>
          </tr>
          <tr>
            <th>Client:</th>
            <td>{order.compagnyName}</td>
          </tr>
          <tr>
            <th>Date:</th>
            <td>{formatDateSlash(order.date)}</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-5 flex items-center justify-between text-sm font-semibold">
        <button
          type="button"
          className="text-blue-400 mt-5 text-sm font-semibold cursor-pointer"
          onClick={() => fetchCommandPdf(order._id, order.orderNumber)}
          title="Voir le bon de commande"
          aria-label="Voir le bon de commande"
        >
          <Eye className="size-5" />
        </button>

        <button
          type="button"
          className="text-blue-400 mt-5 text-sm font-semibold cursor-pointer"
          onClick={() => onEdit?.(order)}
          title="Modifier"
          aria-label="Modifier"
        >
          <Pencil className="size-5" />
        </button>
      </div>
    </div>
  );
};

export default OrderItem;