import { useState } from "react";
import { formatDateSlash } from "../../utils/formatDate.js";

const OrderItem = ({ order, fetchCommandPdf, handleSelect, selectedOrder }) => {
  const [selected, setSelected] = useState(false);

  return (
    <div
      className={
        " border-2 border-black border-opacity-10 rounded-lg px-6 transition-all py-4 " +
        (selectedOrder.includes(order) ? "bg-blue-100" : "")
      }
    >
      <div className="flex items-center gap-2">
        {order.status.toLowerCase() == "pending" && (
          <input
            type="checkbox"
            className="mr-2 size-5 "
            onChange={(e) => {
              setSelected(e.target.checked);
              handleSelect(order);
            }}
          />
        )}
        <p className="font-semibold text-lg">COMMANDE-{order.orderNumber}</p>
      </div>

      <table className="order-item-table w-full mt-3">
        <tr>
          <th>Total:</th>
          <td>{order.totalPrice}€</td>
        </tr>
        <tr>
          <th>Client:</th>
          <td>{order.compagnyName}</td>
        </tr>
        <tr>
          <th>Date:</th>
          <td>{formatDateSlash(order.date)}</td>
        </tr>
      </table>

      <p
        className="text-blue-400 mt-5 text-sm font-semibold cursor-pointer"
        onClick={() => fetchCommandPdf(order._id, order.orderNumber)}
      >
        Télécharger la commande
      </p>
    </div>
  );
};

export default OrderItem;
