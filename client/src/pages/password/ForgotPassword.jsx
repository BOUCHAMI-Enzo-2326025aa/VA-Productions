import { useState } from "react";
import axios from "axios";
import va_logo from "../../assets/va-production-logo.png";
import loading_gif from "../../assets/loading-gif.svg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    setLoading(true);
    try {
      const { data } = await axios.post(
        import.meta.env.VITE_API_HOST + "/api/user/password/forgot",
        { email }
      );
      setMessage(data?.message || "Demande envoyée.");
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
          <p className="text-[#3F3F3F]">Mot de passe oublié</p>
          <p className="text-white bg-[#3F3F3F] w-fit px-3 py-1 mt-1">V.A Productions</p>
        </div>
        <p className="max-w-md mt-5 opacity-70">
          Entrez votre email. Si un compte existe, vous recevrez un lien pour
          réinitialiser votre mot de passe.
        </p>

        {message && (
          <p className="mt-4 bg-green-100 text-green-800 border border-green-200 px-3 py-2 rounded">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 bg-red-100 text-red-800 border border-red-200 px-3 py-2 rounded">
            {error}
          </p>
        )}

        <form className="mt-6 flex flex-col gap-5" onSubmit={onSubmit}>
          <label className="flex flex-col font-medium text-[15px]">
            Email
            <input
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="border-[#3F3F3F] border-[0.75px] border-opacity-15 w-full py-[10px] rounded-[5px] px-2 mt-1"
            />
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
              {!loading && <p>Envoyer le lien</p>}
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

export default ForgotPassword;
