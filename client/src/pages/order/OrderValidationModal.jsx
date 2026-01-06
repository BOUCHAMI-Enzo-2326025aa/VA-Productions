import loader from "../../assets/loader.gif";
import Button from "../../components/ui/Button.jsx";
import success_illustration from "../../assets/invoice-create-illustration.svg";
const OrderValidationModal = ({ loading = false, error = "", onClose }) => {
  return (
    <>
      <div className="absolute text-[#3F3F3F] bg-black bgAppearAnimation w-screen min-h-full h-screen z-[99] left-0 top-0 bg-opacity-50 flex  justify-center">
        <div className="bg-white w-[700px] max-h-[70vh] h-fit z-20 right-[50%] -translate-x-[25%] appearAnimation rounded px-5 py-8 flex flex-col justify-center items-center mt-[50vh] -translate-y-[50%]">
          {loading == "pending" ? (
            <>
              <img className="size-24" src={loader} />
              <p className="text-2xl font-bold text-center">
                Création des factures
              </p>
              <p className="text-center">
                La création des factures est en cours, cela peut prendre un
                moment ...
              </p>
            </>
          ) : loading == "error" ? (
            <>
              <p className="text-2xl font-bold text-center">Impossible de valider</p>
              <p className="text-center text-sm opacity-80 w-[90%] mt-3 whitespace-pre-line">
                {error || "Certaines commandes ne peuvent pas être validées."}
              </p>
              <Button
                value={"Fermer"}
                className={" w-[70%] mt-10"}
                onClickFunction={() => onClose?.()}
              />
            </>
          ) : (
            <>
              <img className="size-64" src={success_illustration} />
              <p className="text-2xl font-bold text-center mt-7">
                Facture créée avec succès
              </p>
              <p className="text-center text-sm opacity-80 w-[90%]">
                Vous pouvez desormais consulter vos factures dans l'onglet
                facture, ou en cliquant sur le bouton ci-dessous.
              </p>
              <Button
                value={"Voir mes factures"}
                className={" w-[80%] mt-10"}
                onClickFunction={() => (window.location = "/invoice")}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default OrderValidationModal;
