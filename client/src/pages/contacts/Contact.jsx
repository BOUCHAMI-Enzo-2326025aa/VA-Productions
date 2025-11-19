import { useState, useEffect } from "react";
import axios from "axios";
import SearchIcon from "../../assets/SearchIcon";
import CardContact from "./components/CardContact";
import DetailContact from "./components/DetailContact";
import ModalContact from "./components/ModalContact";
import "./contact.css";
import Button from "../../components/ui/Button";
import DetailContactV2 from "./components/DetailContactV2";
import SnackBar from "./components/SnackBar";

const Contact = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactsList, setContactsList] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedContactCompany, setSelectedContactCompany] = useState("");
  const [isFetching, setIsFetching] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    type: "",
    message: "",
  });

  let hasFetchedContact = false;

  useEffect(() => {
    fetchContact();
  }, []);

  useEffect(() => {
    if (query) {
      const filtered = contactsList?.filter((contact) => {
        return (
          contact?.status.toLowerCase().includes(query.toLowerCase()) ||
          contact?.company.toLowerCase().includes(query.toLowerCase()) ||
          contact?.name.toLowerCase().includes(query.toLowerCase()) ||
          contact?.surname.toLowerCase().includes(query.toLowerCase()) ||
          contact?.email.toLowerCase().includes(query.toLowerCase()) ||
          contact?.phoneNumber.includes(query)
        );
      });
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contactsList);
    }
  }, [query, contactsList]);

  useEffect(() => {
    if (!selectedContactId) {
      setIsMenuOpen(false);
    }
  }, [selectedContactId]);

  const fetchContact = async () => {
    if (hasFetchedContact) return;
    hasFetchedContact = true;
    setIsFetching(true);
    try {
      const response = await axios.get(
        import.meta.env.VITE_API_HOST + "/api/contact/"
      );
      setContactsList(response.data.contactList);
      setFilteredContacts(response.data.contactList);
    } catch (error) {
      console.error("Erreur lors de la récupération des contacts : ", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleOpenDetail = (id) => {
    const contact = contactsList.find((contact) => contact._id === id);
    if (contact) {
      setSelectedContactId(id);
      setSelectedContactCompany(contact.company);
      setIsMenuOpen(true);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const updateContactLocally = (contactId, fieldName, newValue) => {
    setContactsList((prevContactsList) =>
      prevContactsList.map((contact) =>
        contact._id === contactId
          ? { ...contact, [fieldName]: newValue }
          : contact
      )
    );
    setFilteredContacts((prevFilteredContacts) =>
      prevFilteredContacts.map((contact) =>
        contact._id === contactId
          ? { ...contact, [fieldName]: newValue }
          : contact
      )
    );
  };

  const deleteContact = async (contactId, adminPassword = null) => {
    try {
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      const url = import.meta.env.VITE_API_HOST + "/api/contact/" + contactId;
      const config = {
        headers: {},
      };
      if (token) config.headers.Authorization = token;
      if (adminPassword) {
        config.data = { adminPassword };
      }

      await axios.delete(url, config);
      setContactsList((prev) =>
        prev.filter((contact) => contact._id !== contactId)
      );
      setFilteredContacts((prev) =>
        prev.filter((contact) => contact._id !== contactId)
      );
      setIsMenuOpen(false);
      setIsModalOpen(false);
      setSnackbar({
        open: true,
        type: "success",
        message: "Le contact a été supprimé avec succès !",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression du contact : ", error);
      if (!adminPassword) {
        setSnackbar({
          open: true,
          type: "error",
          message:
            "Impossible de supprimer le contact pour le moment. Veuillez réessayer.",
        });
      }
      throw error;
    }
  };

  return (
    <>
      {snackbar.open && (
        <SnackBar
          type={snackbar.type}
          message={snackbar.message}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        />
      )}
      <div className="bg-[#E8E9EB] w-full ">
        {selectedContactId && (
          <DetailContactV2
            contactId={selectedContactId}
            closeDetail={() => setSelectedContactId(null)}
            setContactsList={setContactsList}
            deleteContact={deleteContact}
          />
        )}

        <div className="flex flex-col space-y-8 md:space-y-12 pt-6">
          <div className="flex flex-col ">
            <p className="font-inter text-[#3F3F3F] text-3xl md:text-4xl font-bold">
              Contacts
            </p>
            <p className="font-inter text-[#3F3F3F] text-lg md:text-xl font-medium opacity-70">
              Retrouvez la liste de tous les contacts enregistrés
            </p>
          </div>
          <div className="flex flex-col space-y-5">
            <div className="flex w-full flex-col gap-5 md:flex-row justify-between items-center ">
              <div className="flex flex-row border-[1px] border-[#3F3F3F] border-opacity-15 rounded-lg p-2.5 space-x-2 items-center w-full md:w-auto">
                <SearchIcon />
                <input
                  type="text"
                  className="bg-transparent focus:border-transparent focus:ring-0 border-transparent focus:outline-none font-inter text-[#3F3F3F] placeholder-opacity-50 flex-1"
                  placeholder="Rechercher un contact"
                  onChange={(e) => setQuery(e.target.value)}
                  value={query}
                />
                {query && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#5f6368"
                    onClick={() => {
                      setQuery("");
                    }}
                    className="cursor-pointer"
                  >
                    <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                  </svg>
                )}
              </div>
              <Button
                onClickFunction={handleOpenModal}
                value={"Ajouter un contact"}
                className="w-full md:w-auto"
              />
            </div>
            {isFetching ? (
              <div className="flex flex-row gap-2 w-full items-center justify-center pt-10">
                <div className="w-3 h-3 rounded-full bg-gray-500 animate-bounce"></div>
                <div className="w-3 h-3 rounded-full bg-gray-500 animate-bounce [animation-delay:-.3s]"></div>
                <div className="w-3 h-3 rounded-full bg-gray-500 animate-bounce [animation-delay:-.5s]"></div>
              </div>
            ) : (
              <>
                {filteredContacts.length > 0 ? (
                  <div className="contact-grid">
                    {filteredContacts?.map((contact) => (
                      <CardContact
                        key={contact._id}
                        id={contact._id}
                        company={contact.company}
                        name={contact.name}
                        surname={contact.surname}
                        phoneNumber={contact.phoneNumber}
                        lastCall={contact.lastCall}
                        handleOpenDetail={handleOpenDetail}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col w-full justify-center items-center pt-10">
                    <p className="font-inter text-[#3F3F3F] text-base font-medium opacity-70">
                      Aucun contact trouvé.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ModalContact
        handleCloseModal={handleCloseModal}
        fetchContact={fetchContact}
        isModalOpen={isModalOpen}
      />
    </>
  );
};

export default Contact;