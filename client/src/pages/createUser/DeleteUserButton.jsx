import { useState } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import axios from "axios";

const DeleteUserButton = ({ userId, userName, isAdmin, onUserDeleted }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteRequest = () => {
    if (!isAdmin) return;
    setShowDeleteModal(true);
    setPassword("");
    setError("");
  };

  const handleConfirmDelete = async () => {
    if (!password) {
      setError("Veuillez entrer votre mot de passe");
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await axios.delete(
        import.meta.env.VITE_API_HOST + `/api/user/${userId}`,
        {
          headers: {
            Authorization: JSON.parse(localStorage.getItem("user"))?.token,
          },
          data: { adminPassword: password },
        }
      );

      setShowDeleteModal(false);
      setPassword("");
      onUserDeleted(userId);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      setError(
        error.response?.data?.erreur ||
          "Erreur lors de la suppression. Vérifiez votre mot de passe."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setPassword("");
    setError("");
  };

  if (!isAdmin) return null;

  return (
    <>
      <button
        onClick={handleDeleteRequest}
        className="p-2 text-red-600 hover:bg-red-50 rounded transition"
        title="Supprimer l'utilisateur"
        disabled={isDeleting}
      >
        <Trash2 size={18} />
      </button>

      {/* Modal de confirmation avec mot de passe */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-[#3F3F3F] mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer l'utilisateur{" "}
              <strong>{userName}</strong> ? Cette action est irréversible.
            </p>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#3F3F3F] mb-2 relative">
                Mot de passe administrateur
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleConfirmDelete()}
                  className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]"
                  placeholder="Entrez votre mot de passe"
                  autoFocus
                  disabled={isDeleting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={
                    showPassword
                      ? "Cacher le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition"
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition disabled:opacity-50"
                disabled={isDeleting || !password}
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteUserButton;
