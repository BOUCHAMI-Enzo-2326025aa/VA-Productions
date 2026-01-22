import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./login.css";
import va_logo from "../../assets/va-production-logo.png";
import loading_gif from "../../assets/loading-gif.svg";
import ErrorMessage from "./ErrorMessage";

const TTL_MS = 5 * 60 * 1000;

const readChallenge = () => {
  try {
    const raw = localStorage.getItem("admin2fa");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const formatCode = (value) => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
};

const getDigitsOnly = (value) => String(value || "").replace(/\D/g, "");

const AdminTwoFactor = () => {
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Important: ne pas memoïser, sinon le bouton "Renvoyer" met à jour le localStorage
  // mais cette page continue d'utiliser l'ancienne nonce => code toujours invalide.
  const [challenge, setChallenge] = useState(() => readChallenge());

  const expired = useMemo(() => {
    if (!challenge?.createdAt) return true;
    return Date.now() - Number(challenge.createdAt) > TTL_MS;
  }, [challenge]);

  useEffect(() => {
    // Si pas de challenge en cours => retour login
    if (!challenge?.email || !challenge?.nonce) {
      location.replace("/connexion");
      return;
    }

    // Challenge trop vieux => demande de login à nouveau
    if (expired) {
      setErrorMessage("Votre demande a expiré. Veuillez vous reconnecter.");
    }
  }, [challenge, expired]);

  const refreshChallenge = () => {
    const next = readChallenge();
    setChallenge(next);
    return next;
  };

  const onSubmit = async () => {
    setErrorMessage(null);
  setSuccessMessage(null);

    const current = refreshChallenge();

    if (!current?.email || !current?.nonce) {
      location.replace("/connexion");
      return;
    }

    const currentExpired = !current?.createdAt
      ? true
      : Date.now() - Number(current.createdAt) > TTL_MS;

    if (currentExpired) {
      setErrorMessage("Votre demande a expiré. Veuillez vous reconnecter.");
      return;
    }

    const clean = getDigitsOnly(code);
    if (clean.length !== 6) {
      setErrorMessage("Veuillez renseigner le code à 6 chiffres.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        import.meta.env.VITE_API_HOST + "/api/user/login/admin-2fa/verify",
        {
          email: current.email,
          nonce: current.nonce,
          code: clean,
        }
      );

      localStorage.removeItem("admin2fa");
      localStorage.setItem("user", JSON.stringify(response.data));
      location.replace("/dashboard");
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setErrorMessage(null);
  setSuccessMessage(null);

  const current = refreshChallenge();

  if (!current?.email) {
      location.replace("/connexion");
      return;
    }

    setResendLoading(true);
    try {
      const response = await axios.post(
        import.meta.env.VITE_API_HOST + "/api/user/login/admin-2fa/request",
        { email: current.email }
      );

      const next = {
        ...current,
        nonce: response?.data?.nonce || current.nonce,
        createdAt: Date.now(),
      };
      localStorage.setItem("admin2fa", JSON.stringify(next));
      setChallenge(next);
      setCode("");
  setSuccessMessage("Un code a été renvoyé avec succès.");
    } catch {
      setErrorMessage("Impossible de renvoyer le code. Veuillez réessayer.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="relative flex w-full min-h-screen items-center justify-center overflow-x-hidden p-4">
      <img
        className="w-48 h-fit absolute left-6 top-6 md:left-12 md:top-12"
        src={va_logo}
        alt="V.A Productions Logo"
      />

      <div className={`w-full max-w-md flex flex-col font-inter text-sm md:min-w-[400px] ${errorMessage ? "pt-20" : ""}`}>
        {errorMessage && <ErrorMessage message={errorMessage} />}
        {successMessage && (
          <p className="bg-green-400 px-6 py-2 w-full text-white rounded-[5px]">
            {successMessage}
          </p>
        )}

        <div className="font-bold text-4xl md:text-5xl">
          <p className="text-[#3F3F3F]">Vérification</p>
          <p className="text-white bg-[#3F3F3F] w-fit px-3 py-1 mt-1">Administrateur</p>
        </div>

        <p className="max-w-md mt-5 opacity-70">
          Saisissez le code à 6 chiffres envoyé par email. Il est valable 5 minutes.
        </p>

        <form className="mt-6 flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
          <label className="flex flex-col font-medium text-[15px]">
            Code (ex: 123 456)
            <input
              inputMode="numeric"
              autoFocus
              value={formatCode(code)}
              disabled={expired}
              onChange={(e) => setCode(e.target.value)}
              className="border-[#3F3F3F] border-[0.75px] border-opacity-15 w-full py-[10px] rounded-[5px] px-2 mt-1 text-lg tracking-widest"
              placeholder="123 456"
            />
          </label>

          <div className="flex flex-col w-full gap-2 mt-2">
            <button
              className="bg-button w-full py-[14px] active:scale-95 rounded-[5px] text-white flex justify-center items-center"
              onClick={onSubmit}
              type="submit"
              disabled={loading || expired}
            >
              {loading && <img className="size-6" src={loading_gif} alt="Chargement" />}
              {!loading && <p>Valider</p>}
            </button>

            <button
              className="w-full border-[#5C89E0] active:scale-95 text-[#5C89E0] hover:text-white hover:bg-[#5C89E0] transition-all border-2 py-3 rounded-[5px] disabled:opacity-50"
              type="button"
              disabled={resendLoading}
              onClick={resend}
            >
              {resendLoading ? "Envoi…" : "Renvoyer un code"}
            </button>

            <button
              className="w-full border-gray-300 active:scale-95 text-gray-700 hover:text-white hover:bg-gray-700 transition-all border-2 py-3 rounded-[5px]"
              type="button"
              onClick={() => {
                localStorage.removeItem("admin2fa");
                location.replace("/connexion");
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminTwoFactor;
