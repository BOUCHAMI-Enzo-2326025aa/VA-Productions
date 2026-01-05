import { useState, useEffect } from "react";
import axios from "axios";
import { Upload, Trash2, Edit2, Plus, X } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import ConfirmModal from "../../components/ConfirmModal";
import ImageCropper from "../../components/ImageCropper";
import "./Magazine.css";

// Définit les types standards pour le menu déroulant
const STANDARD_TYPES = ["Magazine"];

const Magazine = () => {
  const { isAdmin } = useAuth();
  const [magazines, setMagazines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMagazine, setEditingMagazine] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, type: "", message: "" });
  const [deleteModal, setDeleteModal] = useState({
    open: false, magazineId: null, magazineName: "", loading: false, error: "",
  });

  const [formData, setFormData] = useState({
    nom: "",
    type: "Magazine",
    customType: "",
    image: "",
  });
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageForCropper, setImageForCropper] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);

  const fetchMagazines = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_HOST}/api/magazine/`);
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

  const showSnackbar = (type, message) => {
    setSnackbar({ open: true, type, message });
    setTimeout(() => setSnackbar({ open: false, type: "", message: "" }), 3000);
  };

  const handleOpenCreateModal = () => {
    setEditingMagazine(null);
    setFormData({ nom: "", type: "Magazine", customType: "", image: "" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (magazine) => {
    setEditingMagazine(magazine);
    const isStandardType = STANDARD_TYPES.includes(magazine.type);
    setFormData({
      nom: magazine.nom,
      type: isStandardType ? magazine.type : "Autre",
      customType: isStandardType ? "" : magazine.type,
      image: magazine.image,
    });
    setOriginalImage(null); // Pas d'image originale en mode édition (l'image en BDD est déjà croppée)
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMagazine(null);
    setFormData({ nom: "", type: "Magazine", customType: "", image: "" });
    setOriginalImage(null);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showSnackbar("error", "Veuillez sélectionner un fichier image");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showSnackbar("error", "L'image ne doit pas dépasser 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        setOriginalImage(imageData);
        setImageForCropper(imageData);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage) => {
    setFormData({ ...formData, image: croppedImage });
    setIsCropperOpen(false);
    setImageForCropper(null);
    showSnackbar("success", "Image recadrée avec succès");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nom.trim()) {
      showSnackbar("error", "Le nom du magazine est obligatoire");
      return;
    }
    if (formData.type === 'Autre' && !formData.customType.trim()) {
      showSnackbar("error", "Veuillez préciser le type de magazine.");
      return;
    }
    if (!formData.image.trim()) {
      showSnackbar("error", "L'image du magazine est obligatoire");
      return;
    }
    const finalType = formData.type === 'Autre' ? formData.customType : formData.type;
    try {
      const payload = {
        nom: formData.nom,
        type: finalType,
        image: formData.image, // Envoyer l'image base64 directement
      };
      if (editingMagazine) {
        await axios.put(
          `${import.meta.env.VITE_API_HOST}/api/magazine/${editingMagazine._id}`,
          payload
        );
        showSnackbar("success", "Magazine modifié avec succès");
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_HOST}/api/magazine/create`,
          payload
        );
        showSnackbar("success", "Magazine créé avec succès");
      }
      fetchMagazines();
      handleCloseModal();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du magazine:", error);
      const errorMessage = error.response?.data?.erreur || "Erreur lors de la sauvegarde";
      showSnackbar("error", errorMessage);
    }
  };

  const handleOpenDeleteModal = (id, nom) => {
    setDeleteModal({ open: true, magazineId: id, magazineName: nom, loading: false, error: "" });
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({ open: false, magazineId: null, magazineName: "", loading: false, error: "" });
  };

  const handleConfirmDelete = async (password) => {
    setDeleteModal((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_HOST}/api/magazine/${deleteModal.magazineId}`,
        { data: { adminPassword: password } }
      );
      showSnackbar("success", "Magazine supprimé avec succès");
      fetchMagazines();
      handleCloseDeleteModal();
    } catch (error) {
      console.error("Erreur lors de la suppression du magazine:", error);
      const errorMessage = error.response?.data?.erreur || "Erreur lors de la suppression";
      setDeleteModal((prev) => ({ ...prev, loading: false, error: errorMessage }));
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
      {snackbar.open && (
        <div className={`fixed top-5 right-5 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-semibold ${snackbar.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          {snackbar.message}
        </div>
      )}
      <div className="flex justify-between items-center mt-10 magazine-header-container">
        <div>
          <p className="font-bold text-lg md:text-xl leading-3">Gestion des Magazines</p>
          <p className="opacity-80 mt-2 text-sm md:text-base">Créez et gérez les magazines disponibles</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-[#3F3F3F] text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-80 transition flex items-center gap-2"
        >
          <Plus size={20} />
          Nouveau Magazine
        </button>
      </div>
      {isLoading ? (
        <div className="mt-10 text-center">Chargement...</div>
      ) : magazines.length === 0 ? (
        <div className="mt-10 text-center opacity-70">Aucun magazine créé pour le moment</div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {magazines.map((magazine) => (
            <div key={magazine._id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition">
              <div className="relative w-full aspect-square bg-gray-200">
                <img
                  src={magazine.image || "https://via.placeholder.com/300x400?text=Image+Non+Disponible"}
                  alt={magazine.nom}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { e.target.src = "https://via.placeholder.com/300x400?text=Image+Non+Disponible"; }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg">{magazine.nom}</h3>
                <p className="text-sm text-gray-500 mb-3">{magazine.type}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleOpenEditModal(magazine)} className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition flex items-center justify-center gap-2">
                    <Edit2 size={16} /> Modifier
                  </button>
                  <button onClick={() => handleOpenDeleteModal(magazine._id, magazine.nom)} className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 transition flex items-center justify-center gap-2">
                    <Trash2 size={16} /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingMagazine ? "Modifier le magazine" : "Nouveau magazine"}</h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold mb-2">Nom du magazine *</label>
                <input
                  type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: WMag" required
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Type de magazine *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, customType: "" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="" disabled>Sélectionnez un type</option>
                  <option value="Magazine">Magazine</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              {formData.type === "Autre" && (
                <div className="appear-animation">
                  <label className="block font-semibold mb-2 text-sm">Précisez le type *</label>
                  <input
                    type="text" value={formData.customType} onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Journal" required
                  />
                </div>
              )}
              <div>
                <label className="block font-semibold mb-2">Image de couverture *</label>
                <div className="mb-3">
                  <label className="w-full cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
                      <Upload size={20} className="text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Choisir une image depuis le PC</span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
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
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ou entrez l'URL de l'image"
                />
                {(formData.image) && (
                  <div className="mt-3">
                    <p className="text-sm opacity-70 mb-2">Aperçu (carré 224x224) :</p>
                    <div className="flex justify-center">
                      <div style={{ width: '100%', maxWidth: '14rem', aspectRatio: '1 / 1', overflow: 'hidden', flex: 'none' }}>
                        <img
                          src={formData.image}
                          alt="Aperçu"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          className="rounded border"
                          onError={(e) => { e.target.src = "https://via.placeholder.com/224x224?text=Image+Non+Valide"; }}
                        />
                      </div>
                    </div>
                    {originalImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageForCropper(originalImage); // Utiliser l'image originale non-croppée
                          setIsCropperOpen(true);
                        }}
                        className="mt-2 w-full bg-blue-500 text-white py-2 rounded font-medium hover:bg-blue-600 transition"
                      >
                        Recadrer l'image
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-400 transition">Annuler</button>
                <button type="submit" className="flex-1 bg-[#3F3F3F] text-white py-2 rounded-lg font-semibold hover:bg-opacity-80 transition">{editingMagazine ? "Modifier" : "Créer"}</button>
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
      {isCropperOpen && imageForCropper && (
        <ImageCropper
          imageUrl={imageForCropper}
          onCropComplete={handleCropComplete}
          onClose={() => {
            setIsCropperOpen(false);
            setImageForCropper(null);
          }}
        />
      )}
    </div>
  );
};

export default Magazine;