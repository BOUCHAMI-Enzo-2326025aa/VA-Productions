import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import va_logo from "../../assets/va-production-logo.png";
import loading_gif from "../../assets/loading-gif.svg";
import { Eye, EyeOff } from "lucide-react";

const isPasswordStrong = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  return regex.test(password);
};

const ResetPassword = () => {
  const { token } = useParams();
  const safeToken = useMemo(() => token || "", [token]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!isPasswordStrong(newPassword)) {
      setError(
        "Mot de passe trop faible. Il doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole."
      );
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        import.meta.env.VITE_API_HOST + "/api/user/password/reset",
        { token: safeToken, newPassword }
      );
      setMessage(data?.message || "Mot de passe mis à jour.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Une erreur est survenue. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex w-full min-h-screen items-center justify-center overflow-x-hidden p-4">
      <img
        className="w-48 h-fit absolute left-6 top-6 md:left-12 md:top-12"
        src={va_logo}
        alt="V.A Productions Logo"
      />

      <div className="w-full max-w-md flex flex-col font-inter text-sm md:min-w-[400px]">
        <div className="font-bold text-3xl md:text-4xl">
          <p className="text-[#3F3F3F]">Réinitialiser le mot de passe</p>
          <p className="text-white bg-[#3F3F3F] w-fit px-3 py-1 mt-1">V.A Productions</p>
        </div>

        <p className="max-w-md mt-5 opacity-70">
          Choisissez un nouveau mot de passe.
        </p>

        {message && (
          <p className="mt-4 bg-green-100 text-green-800 border border-green-200 px-3 py-2 rounded">
            {message} <a className="underline" href="/connexion">Aller à la connexion</a>
          </p>
        )}
        {error && (
          <p className="mt-4 bg-red-100 text-red-800 border border-red-200 px-3 py-2 rounded">
            {error}
          </p>
        )}

        <form className="mt-6 flex flex-col gap-5" onSubmit={onSubmit}>
          <label className="flex flex-col font-medium text-[15px]">
            Nouveau mot de passe
            <div className="relative">
              <input
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type={showNewPassword ? "text" : "password"}
                className="border-[#3F3F3F] border-[0.75px] border-opacity-15 w-full py-[10px] rounded-[5px] px-2 pr-10 mt-1"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </label>

          <label className="flex flex-col font-medium text-[15px]">
            Confirmer le mot de passe
            <div className="relative">
              <input
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type={showConfirmPassword ? "text" : "password"}
                className="border-[#3F3F3F] border-[0.75px] border-opacity-15 w-full py-[10px] rounded-[5px] px-2 pr-10 mt-1"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </label>

          <div className="flex flex-col w-full gap-2 mt-2">
            <button
              className="bg-button w-full py-[14px] active:scale-95 rounded-[5px] text-white flex justify-center items-center"
              type="submit"
              disabled={loading}
            >
              {loading && (
                <img className="size-6" src={loading_gif} alt="Chargement" />
              )}
              {!loading && <p>Mettre à jour</p>}
            </button>

            <a
              className="w-full text-center border-[#5C89E0] active:scale-95 text-[#5C89E0] hover:text-white hover:bg-[#5C89E0] transition-all border-2 py-3 rounded-[5px]"
              href="/connexion"
            >
              Retour à la connexion
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
