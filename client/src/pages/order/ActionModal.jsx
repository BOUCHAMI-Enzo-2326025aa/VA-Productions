import check_illustration from "../../assets/check-illustration.svg";
import cancel_illustration from "../../assets/cancel-illustration.svg";

const ActionModal = ({ selectedOrder, validateOrder, cancelOrder }) => {
  return (
    <div className="bg-white w-[800px] px-2 py-4 h-fit absolute right-0 -bottom-2 translate-y-[100%] z-[60] appear-animation rounded">
      <p className="text-left ml-4 mt-2">ACTIONS</p>
      <div className="text-left ml-4 opacity-80 font-normal">
        Choisissez une action à effectuer sur la ou les commande(s) suivante(s) :
        <div className="font-semibold flex flex-wrap gap-1 mt-2">
          {selectedOrder.map((order, index) => (
            <div
              className="bg-blue-600 text-white bg-opacity-80 px-4 py-1 rounded"
              key={index}
            >
              Commande n° {order.orderNumber}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 hover:bg-black hover:bg-opacity-10 rounded mt-2">
        <img
          className="size-44 rounded-xl opacity-80 "
          src={check_illustration}
          alt="check"
        />
        <div className="flex flex-col text-left mb-2" onClick={validateOrder}>
          <p className="font-bold text-base ">Valider les bons de commande</p>
          <p className="font-normal opacity-80 text-sm">
            Vous allez valider les bons de commande selectionnés, les factures
            liées à ces bons de commande vont être crées{" "}
          </p>
          <div className="mt-5 flex items-center gap-2">
            <svg
              className="size-4 fill-red-500"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 -960 960 960"
            >
              <path d="m40-120 440-760 440 760H40Zm440-120q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Z" />
            </svg>
            <p className="font-bold text-red-500 ">
              Cette action est irréversible, la facture ne pourra pas être
              modifiée ni supprimée
            </p>
          </div>
        </div>
      </div>
      <div
        className="flex items-center gap-3 hover:bg-black hover:bg-opacity-10 rounded"
        onClick={cancelOrder}
      >
        <img
          className="size-44 rounded-xl opacity-80 "
          src={cancel_illustration}
          alt="check"
        />
        <div className="flex flex-col text-left mb-2">
          <p className="font-bold text-base ">Annuler les bons de commande</p>
          <p className="font-normal opacity-80 text-sm">
            Vous allez annuler les bons de commande selectionnés
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActionModal;
