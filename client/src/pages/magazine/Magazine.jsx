import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Upload, Trash2, Edit2, Plus, X } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import ConfirmModal from "../../components/ConfirmModal";
import "./Magazine.css"; // Importer le nouveau fichier CSS

const Magazine = () => {
  const { isAdmin } = useAuth();
  const [magazines, setMagazines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMagazine, setEditingMagazine] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, type: "", message: "" });

  // État pour le modal de confirmation de suppression
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    magazineId: null,
    magazineName: "",
    loading: false,
    error: "",
  });

  // État du formulaire
  const [formData, setFormData] = useState({
    nom: "",
    image: "",
    imageFile: null, // Fichier uploadé depuis le PC
  });

  // Récupérer tous les magazines
  const fetchMagazines = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        import.meta.env.VITE_API_HOST + "/api/magazine/"
      );
      setMagazines(response.data.magazines);
    } catch (error) {
      console.error("Erreur lors de la récupération des magazines:", error);
      showSnackbar("error", "Erreur lors du chargement des magazines");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchMagazines();
    }
  }, [isAdmin]);

  // Afficher un message temporaire
  const showSnackbar = (type, message) => {
    setSnackbar({ open: true, type, message });
    setTimeout(() => {
      setSnackbar({ open: false, type: "", message: "" });
    }, 3000);
  };

  // Ouvrir le modal pour créer
  const handleOpenCreateModal = () => {
    setEditingMagazine(null);
    setFormData({ nom: "", image: "", imageFile: null });
    setIsModalOpen(true);
  };

  // Ouvrir le modal pour éditer
  const handleOpenEditModal = (magazine) => {
    setEditingMagazine(magazine);
    setFormData({ nom: magazine.nom, image: magazine.image, imageFile: null });
    setIsModalOpen(true);
  };

  // Fermer le modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMagazine(null);
    setFormData({ nom: "", image: "", imageFile: null });
  };

  // Gérer la sélection d'un fichier image
  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith("image/")) {
        showSnackbar("error", "Veuillez sélectionner un fichier image");
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar("error", "L'image ne doit pas dépasser 5MB");
        return;
      }
      
      setFormData({ ...formData, imageFile: file, image: "" });
    }
  };

  // Créer ou modifier un magazine
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nom.trim()) {
      showSnackbar("error", "Le nom du magazine est obligatoire");
      return;
    }

    if (!formData.image.trim() && !formData.imageFile) {
      showSnackbar("error", "L'image du magazine est obligatoire");
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("nom", formData.nom);
      
      if (formData.imageFile) {
        // Upload d'un fichier
        formDataToSend.append("image", formData.imageFile);
      } else if (formData.image) {
        // URL fournie
        formDataToSend.append("image", formData.image);
      }

      if (editingMagazine) {
        // Modification
        await axios.put(
          `${import.meta.env.VITE_API_HOST}/api/magazine/${editingMagazine._id}`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        showSnackbar("success", "Magazine modifié avec succès");
      } else {
        // Création
        await axios.post(
          `${import.meta.env.VITE_API_HOST}/api/magazine/create`,
          formDataToSend,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        showSnackbar("success", "Magazine créé avec succès");
      }

      fetchMagazines();
      handleCloseModal();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du magazine:", error);
      const errorMessage =
        error.response?.data?.erreur || "Erreur lors de la sauvegarde";
      showSnackbar("error", errorMessage);
    }
  };

  // Ouvrir le modal de confirmation de suppression
  const handleOpenDeleteModal = (id, nom) => {
    setDeleteModal({
      open: true,
      magazineId: id,
      magazineName: nom,
      loading: false,
      error: "",
    });
  };

  // Fermer le modal de confirmation de suppression
  const handleCloseDeleteModal = () => {
    setDeleteModal({
      open: false,
      magazineId: null,
      magazineName: "",
      loading: false,
      error: "",
    });
  };

  // Confirmer la suppression avec mot de passe
  const handleConfirmDelete = async (password) => {
    setDeleteModal((prev) => ({ ...prev, loading: true, error: "" }));

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_HOST}/api/magazine/${deleteModal.magazineId}`,
        {
          data: { adminPassword: password },
        }
      );
      
      showSnackbar("success", "Magazine supprimé avec succès");
      fetchMagazines();
      handleCloseDeleteModal();
    } catch (error) {
      console.error("Erreur lors de la suppression du magazine:", error);
      const errorMessage =
        error.response?.data?.erreur || "Erreur lors de la suppression";
      
      setDeleteModal((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-[#3F3F3F] mt-10">
        Accès refusé. Vous devez être administrateur pour voir cette page.
      </div>
    );
  }

  return (
    <div className="text-[#3F3F3F] pb-10">
      {/* Snackbar */}
      {snackbar.open && (
        <div
          className={`fixed top-5 right-5 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-semibold ${
            snackbar.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {snackbar.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mt-10 magazine-header-container">
        <div>
          <p className="font-bold text-lg md:text-xl leading-3">Gestion des Magazines</p>
          <p className="opacity-80 mt-2 text-sm md:text-base">
            Créez et gérez les magazines disponibles
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-[#3F3F3F] text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-80 transition flex items-center gap-2"
        >
          <Plus size={20} />
          Nouveau Magazine
        </button>
      </div>

      {/* Liste des magazines */}
      {isLoading ? (
        <div className="mt-10 text-center">Chargement...</div>
      ) : magazines.length === 0 ? (
        <div className="mt-10 text-center opacity-70">
          Aucun magazine créé pour le moment
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {magazines.map((magazine) => (
            <div
              key={magazine._id}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition"
            >
              <div className="relative h-48 bg-gray-200">
                <img
                  src={magazine.image || "https://via.placeholder.com/300x400?text=Image+Non+Disponible"}
                  alt={magazine.nom}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/300x400?text=Image+Non+Disponible";
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-3">{magazine.nom}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditModal(magazine)}
                    className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition flex items-center justify-center gap-2"
                  >
                    <Edit2 size={16} />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleOpenDeleteModal(magazine._id, magazine.nom)}
                    className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 transition flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Création/Édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingMagazine ? "Modifier le magazine" : "Nouveau magazine"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold mb-2">
                  Nom du magazine *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) =>
                    setFormData({ ...formData, nom: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: WMag"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Image de couverture *
                </label>
                
                <div className="mb-3">
                  <label className="w-full cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                      <Upload size={20} className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {formData.imageFile
                          ? formData.imageFile.name
                          : "Choisir une image depuis le PC"}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-sm text-gray-500 font-medium">OU</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <input
                  type="text"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value, imageFile: null })
                  }
                  disabled={!!formData.imageFile}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formData.imageFile ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  placeholder="Ou entrez l'URL de l'image"
                />

                {(formData.image || formData.imageFile) && (
                  <div className="mt-3">
                    <p className="text-sm opacity-70 mb-2">Aperçu :</p>
                    <img
                      src={
                        formData.imageFile
                          ? URL.createObjectURL(formData.imageFile)
                          : formData.image
                      }
                      alt="Aperçu"
                      className="w-full h-48 object-cover rounded border"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/300x400?text=Image+Non+Valide";
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#3F3F3F] text-white py-2 rounded-lg font-semibold hover:bg-opacity-80 transition"
                >
                  {editingMagazine ? "Modifier" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteModal.open}
        title="Supprimer le magazine"
        message={`Êtes-vous sûr de vouloir supprimer le magazine "${deleteModal.magazineName}" ? Cette action est irréversible.`}
        requirePassword={true}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        loading={deleteModal.loading}
        error={deleteModal.error}
      />
    </div>
  );
};

export default Magazine;