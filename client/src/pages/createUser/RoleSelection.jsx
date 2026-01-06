import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";

const RoleSelection = ({ userId, initialRole, isAdmin }) => {
  const [role, setRole] = useState(initialRole || "commercial");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleRoleChangeRequest = (newRole) => {
    if (!isAdmin || newRole === role) return;
    
    // Ouvrir le modal de confirmation
    setPendingRole(newRole);
    setShowPasswordModal(true);
    setPassword("");
    setError("");
  };

  const handleConfirmRoleChange = async () => {
    if (!password) {
      setError("Veuillez entrer votre mot de passe");
      return;
    }

    setIsUpdating(true);
    setError("");
    
    try {
      await axios.put(
        import.meta.env.VITE_API_HOST + `/api/user/${userId}/role`,
        { role: pendingRole, adminPassword: password },
        {
          headers: {
            Authorization: JSON.parse(localStorage.getItem("user"))?.token,
          },
        }
      );
      
      setRole(pendingRole);
      setShowPasswordModal(false);
      setPendingRole(null);
      setPassword("");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du rôle:", error);
      setError(error.response?.data?.erreur || "Erreur lors de la mise à jour du rôle. Vérifiez votre mot de passe.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelRoleChange = () => {
    setShowPasswordModal(false);
    setPendingRole(null);
    setPassword("");
    setError("");
  };

  return (
    <>
      <select
        className="bg-[#DBDEE1] font-semibold px-5 rounded py-2 role-selection"
        value={role}
        onChange={(e) => handleRoleChangeRequest(e.target.value)}
        disabled={!isAdmin || isUpdating}
      >
        <option value="commercial">Commercial</option>
        <option value="admin">Administrateur</option>
      </select>

      {/* Modal de confirmation avec mot de passe */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-[#3F3F3F] mb-4">
              Confirmation du changement de rôle
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Pour modifier le rôle de cet utilisateur, veuillez entrer votre mot de passe administrateur.
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
                  onKeyDown={(e) => e.key === "Enter" && handleConfirmRoleChange()}
                  className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]"
                  placeholder="Entrez votre mot de passe"
                  autoFocus
                  disabled={isUpdating}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelRoleChange}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition"
                disabled={isUpdating}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmRoleChange}
                className="px-4 py-2 bg-[#3F3F3F] text-white rounded hover:bg-[#2F2F2F] transition disabled:opacity-50"
                disabled={isUpdating || !password}
              >
                {isUpdating ? "Confirmation..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoleSelection;
