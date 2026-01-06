import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const ConfirmModal = ({
  open,
  title = "Confirmer l'action",
  message = "Êtes-vous sûr ?",
  requirePassword = false,
  onClose,
  onConfirm,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  loading = false,
  error = "",
}) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (!open) return null;

  const handleConfirm = () => {
    if (requirePassword) {
      onConfirm(password);
    } else {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold text-[#3F3F3F] mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{message}</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {requirePassword && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#3F3F3F] mb-2 relative">
              Mot de passe administrateur
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]"
                placeholder="Entrez votre mot de passe"
                autoFocus
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-3 text-[#5C89E0]"
                aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition"
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-[#3F3F3F] text-white rounded hover:bg-[#2F2F2F] transition disabled:opacity-50"
            disabled={loading || (requirePassword && password.length === 0)}
          >
            {loading ? "Traitement..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
