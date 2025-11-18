import { useEffect, useState, useCallback } from "react";
import ProfileImage from "../../../components/ProfileImage";
import EditContact from "./EditContact";
import SupportRevenu from "./SupportRevenu";
import ambition_sud from "../../../assets/supports/ambition-sud.png";
import roses_en_provence from "../../../assets/supports/roses-en-provence.png";
import rouges_et_blancs from "../../../assets/supports/rouges-et-blancs.png";
import w_mag from "../../../assets/supports/w-mag.png";
import axios from "axios";
import { formatDateSlash } from "../../../utils/formatDate";
import Button from "../../../components/ui/Button";
import ConfirmModal from "../../../components/ConfirmModal";
import useAuth from "../../../hooks/useAuth";
import CardFacture from "./CardFacture";
import CopyConfirmMessage from "./CopyConfirmMessage";
import not_found_illustration from "../../../assets/not-found-illustration.svg";

const DetailContactV2 = ({
  contactId,
  closeDetail,
  setContactsList,
  deleteContact,
}) => {
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contact, setContact] = useState(null);
  const [clientInvoice, setClientInvoice] = useState([]);
  const [showCopyMessage, setShowCopyMessage] = useState(false);
  const [commentValue, setCommentValue] = useState("");
  const [debounceTimer, setDebounceTimer] = useState(null);

  useEffect(() => {
    axios
      .get(import.meta.env.VITE_API_HOST + "/api/contact/" + contactId)
      .then((response) => {
        setContact(response.data);
        setCommentValue(response.data.comments || "");
      });
  }, [contactId]);

  useEffect(() => {
    fetchClientInvoice();
  }, [contact]);

  const handleShowCopyMessage = () => {
    if (showCopyMessage) return;
    setShowCopyMessage(true);
    setTimeout(() => {
      setShowCopyMessage(false);
    }, 1000);
  };

  const handleCopy = (value) => {
    navigator.clipboard.writeText(value);
    handleShowCopyMessage();
  };

  const saveContact = async (contact) => {
    await axios
      .put(import.meta.env.VITE_API_HOST + "/api/contact/" + contactId, contact)
      .then((response) => {
        setContact(response.data);
      });
    setContactsList((prev) => {
      const index = prev.findIndex((c) => c._id === contactId);
      prev[index] = contact;
      return [...prev];
    });
    setContact(contact);
    setIsEditingContact(false);
  };

  const fetchClientInvoice = async () => {
    await axios
      .get(import.meta.env.VITE_API_HOST + "/api/invoice/client/" + contactId)
      .then((response) => {
        setClientInvoice(response.data);
      });
  };

  const handleDebouncedCommentChange = useCallback(
    (value) => {
      if (debounceTimer) clearTimeout(debounceTimer);

      const timer = setTimeout(() => {
        setContact((prev) => ({ ...prev, comments: value }));
        saveContact({ ...contact, comments: value });
      }, 2000);

      setDebounceTimer(timer);
    },
    [debounceTimer, contact]
  );

  const handleImmediateCommentChange = (value) => {
    setCommentValue(value);
    handleDebouncedCommentChange(value);
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const { isAdmin } = useAuth();

  if (contact === null) return <></>;

  return (
    <div className="appearAnimation w-full h-full absolute left-0 top-0 z-10 bg-black bg-opacity-50 p-2 sm:p-4 text-[#3F3F3F]">
      {isEditingContact && (
        <EditContact
          closeModal={() => setIsEditingContact(false)}
          contact={contact}
          setContact={setContact}
          saveContact={saveContact}
        />
      )}
      <div className="bg-white w-full h-full overflow-y-auto rounded-lg px-4 py-6 sm:px-12 sm:py-8">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="flex gap-4 sm:gap-6 items-center">
            <ProfileImage name={contact.company || " "} surname="" />
            <div className="mt-1 text-lg font-semibold flex flex-col">
              <p className="leading-6">
                {contact.name} {contact.surname}
              </p>
              <div className="flex gap-2 text-sm opacity-80 font-medium leading-4">
                <p>{contact.company}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:ml-auto">
            <Button
              value={"Modifier"}
              className={"!py-0 h-10 w-full sm:w-[100px] !min-w-[50px] text-sm"}
              primary={true}
              onClickFunction={() => setIsEditingContact(true)}
            />
            <Button
              value={"Fermer"}
              className={"!py-0 h-10 w-full sm:w-[100px] !min-w-[50px] text-sm"}
              primary={false}
              onClickFunction={closeDetail}
            />
            {isAdmin && (
              <>
                <Button
                  value={"Supprimer"}
                  className={
                    "!py-0 h-10 w-full sm:w-[120px] !min-w-[50px] text-sm bg-red-500 hover:bg-red-600 text-white"
                  }
                  primary={false}
                  onClickFunction={() => {
                    setDeleteError("");
                    setShowDeleteModal(true);
                  }}
                />
                <ConfirmModal
                  open={showDeleteModal}
                  title={"Confirmer la suppression"}
                  message={
                    "Voulez-vous vraiment supprimer ce contact ? Cette action est irréversible."
                  }
                  requirePassword={true}
                  error={deleteError}
                  loading={isDeleting}
                  confirmLabel={"Supprimer"}
                  onClose={() => {
                    setShowDeleteModal(false);
                    setDeleteError("");
                  }}
                  onConfirm={async (adminPassword) => {
                    setIsDeleting(true);
                    setDeleteError("");
                    try {
                      await deleteContact(contactId, adminPassword);
                      setShowDeleteModal(false);
                      closeDetail();
                    } catch (err) {
                      console.error("Erreur suppression contact:", err);
                      const message =
                        err?.response?.data?.erreur ||
                        err?.response?.data ||
                        err?.message ||
                        "Erreur lors de la suppression.";
                      setDeleteError(message);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                />
              </>
            )}
          </div>
        </div>

        <div className="mt-3 flex gap-1 opacity-100">
          <div className="flex items-center gap-2 rounded opacity-80 text-[#3F3F3F] pb-2 ">
            <p className="text-sm font-semibold ">
              Dernière commande <b>{formatDateSlash(contact.lastCall)}</b>
            </p>
          </div>
        </div>

        <div className="mt-1 flex flex-col sm:flex-row gap-2">
          <div
            onClick={() => handleCopy(contact.email)}
            className="bg-[#3f3f3f] cursor-pointer flex border-2 w-full sm:w-fit px-10 py-2 rounded-md gap-1 items-center justify-center"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 -960 960 960">
              <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280 320-200v-80L480-520 160-720v80l320 200Z" />{" "}
            </svg>
            <p className="text-sm font-semibold text-white ">{contact.email}</p>
          </div>
          <div
            onClick={() => handleCopy(contact.phoneNumber)}
            className="bg-[#3f3f3f] cursor-pointer flex border-2 w-full sm:w-fit px-10 py-2 rounded-md gap-1 items-center justify-center"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 -960 960 960">
              <path d="M798-120q-125 0-247-54.5T329-329Q229-429 174.5-551T120-798q0-18 12-30t30-12h162q14 0 25 9.5t13 22.5l26 140q2 16-1 27t-11 19l-97 98q20 37 47.5 71.5T387-386q31 31 65 57.5t72 48.5l94-94q9-9 23.5-13.5T670-390l138 28q14 4 23 14.5t9 23.5v162q0 18-12 30t-30 12Z" />{" "}
            </svg>
            <p className="text-sm font-semibold text-white ">
              {contact.phoneNumber}
            </p>
          </div>
          {showCopyMessage && <CopyConfirmMessage />}
        </div>

        <div className="mt-6 grid gap-2 text-sm text-[#3F3F3F]">
          <p>
            <span className="font-semibold">Statut :</span>{" "}
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${
                contact.status === "CLIENT"
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {contact.status === "CLIENT"
                ? "Client"
                : contact.status === "PROSPECT"
                ? "Prospect"
                : "-"}
            </span>
          </p>
          <p>
            <span className="font-semibold">SIRET :</span> {contact.siret || "-"}
          </p>
          <p>
            <span className="font-semibold">Numéro de TVA :</span>{" "}
            {contact.numTVA || "-"}
          </p>
          <p>
            <span className="font-semibold">Délai de paiement :</span>{" "}
            {contact.delaisPaie || "comptant"}
          </p>
        </div>

        <textarea
          onChange={(e) => handleImmediateCommentChange(e.target.value)}
          className="min-h-[200px] mt-8 w-full bg-black bg-opacity-5 rounded-lg p-4 text-[#3F3F3F] font-inter text-sm resize-none"
          value={commentValue}
        ></textarea>

        <p className="font-bold mt-6 flex gap-3 items-center">
          Revenu par support
          <p className="text-white bg-[#3f3f3f] px-4 rounded text-sm py-[4px] ">
            {clientInvoice.reduce((acc, curr) => acc + curr.totalPrice, 0)}€
          </p>
        </p>

        <div className="flex flex-wrap mt-3 gap-2">
          <SupportRevenu
            image={ambition_sud}
            supportName={"Ambition Sud"}
            invoices={clientInvoice}
          />
          <SupportRevenu
            image={roses_en_provence}
            supportName={"Roses en provence"}
            invoices={clientInvoice}
          />
          <SupportRevenu
            image={rouges_et_blancs}
            supportName={"Rouges et blancs"}
            invoices={clientInvoice}
          />
          <SupportRevenu
            image={w_mag}
            supportName={"WMag"}
            invoices={clientInvoice}
          />
        </div>

        <p className="font-bold mt-10 pb-5">Detail des factures</p>
        {clientInvoice.map((facture) => (
          <div key={facture.id} className="flex flex-col ">
            <CardFacture
              fileName={facture.number + "-" + facture.entreprise + ".pdf"}
              supportList={facture.supportList}
              price={5}
              date={facture.date}
            />
          </div>
        ))}
        {clientInvoice.length === 0 && (
          <div className="flex flex-col justify-center items-center mt-4">
            <img className="size-60" src={not_found_illustration} />
            <p className="mt-4 font-medium">Aucune facture pour le moment !</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailContactV2;