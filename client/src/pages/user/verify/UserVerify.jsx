import { useState } from "react";
import ErrorMessage from "../../login/ErrorMessage";
import axios from "axios";
import magazine_img from "../../../assets/magazine-img.png";
import va_logo from "../../../assets/va-production-logo.png";
import loading_gif from "../../../assets/loading-gif.svg";
import { useParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react"; // Import des icônes

// Importez le CSS de la page de login pour réutiliser les styles
import "../../login/login.css";

const UserVerify = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginSuccessfull, setLoginSuccessfull] = useState(false);
  const [errorMessage, setErrorMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { code, email } = useParams();

  const verifyUser = async () => {
    if (password !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setErrorMessage("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole.");
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    axios
      .post(import.meta.env.VITE_API_HOST + "/api/user/verify", {
        password: password,
        confirmationCode: code,
        email: email,
      })
      .then((response) => {
        setLoginSuccessfull(true);
        localStorage.setItem("user", JSON.stringify(response.data));
        location.replace("/dashboard");
      })
      .catch((error) => {
        setErrorMessage(error.response.data.message);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="relative flex w-full min-h-screen items-center justify-center overflow-x-hidden p-4 md:gap-16 lg:gap-32">
      <img
        className="w-48 h-fit absolute left-6 top-6 md:left-12 md:top-12"
        src={va_logo}
        alt="V.A Productions Logo"
      />

      <div
        className={`w-full max-w-md flex flex-col font-inter text-sm md:min-w-[400px] ${
          errorMessage ? "pt-20" : ""
        }`}
      >
        {errorMessage && <ErrorMessage message={errorMessage} />}
        {loginSuccessfull && (
          <p className="bg-green-400 px-6 py-1 w-full text-white rounded mb-4">
            Compte vérifié avec succès. Redirection...
          </p>
        )}

        {/* HEADER */}
        <div className="font-bold text-4xl md:text-5xl">
          <p className="text-[#3F3F3F]">Vérifiez votre Compte</p>
        </div>
        <p className="max-w-md mt-5 opacity-70">
          Pour vous connecter et accéder à toutes les fonctionnalités, veuillez
          créer un mot de passe pour votre compte.
        </p>

        {/* FORMULAIRE */}
        <form
          className="mt-6 flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            verifyUser();
          }}
        >
          <label className="flex flex-col font-medium text-[15px]">
            Email
            <input
              required
              value={email}
              readOnly={true}
              className="border-[#3F3F3F] border-[0.75px] border-opacity-15 w-full py-[10px] rounded-[5px] px-2 mt-1 bg-gray-100 cursor-not-allowed"
            />
          </label>
          <label className="flex flex-col font-medium text-[15px]">
            Nouveau mot de passe
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                onChange={(e) => setPassword(e.target.value)}
                className="border-[#3F3F3F] border-[0.75px] border-opacity-15 w-full py-[10px] rounded-[5px] px-2 pr-10 mt-1"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
             <p className="text-xs text-gray-500 mt-1">
                Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 symbole
              </p>
          </label>

          <label className="flex flex-col font-medium text-[15px]">
            Confirmer le mot de passe
            <div className="relative">
              <input
                required
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

          {/* BUTTONS */}
          <div className="flex flex-col w-full gap-2 mt-2">
            <button
              className="bg-button w-full py-[14px] active:scale-95 rounded-[5px] text-white flex justify-center items-center"
              type="submit"
            >
              {loading ? (
                <img className="size-6" src={loading_gif} alt="Chargement" />
              ) : (
                <p>Confirmer l'inscription</p>
              )}
            </button>
          </div>
        </form>
      </div>

      <img
        className="hidden md:block h-fit w-fit max-w-md lg:max-w-lg"
        src={magazine_img}
        alt="Magazines"
      />

      {/* Éléments décoratifs cachés sur mobile */}
      <span className="triangle hidden md:block absolute -bottom-60 right-40 blur-md -rotate-45 opacity-70"></span>
      <span className="triangle hidden md:block absolute -top-32 -right-64 scale-75 blur-md rotate-[25deg] opacity-50"></span>
      <span className="w-96 h-96 bg-[#295CC046] -left-32 -bottom-52 absolute rounded-full blur-md rotate-[25deg] opacity-50"></span>
    </div>
  );
};

export default UserVerify;