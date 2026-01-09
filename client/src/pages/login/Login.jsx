import { useState } from "react";
import axios from "axios";
import magazine_img from "../../assets/magazine-img.png";
import "./login.css";
import va_logo from "../../assets/va-production-logo.png";
import loading_gif from "../../assets/loading-gif.svg";
import ErrorMessage from "./ErrorMessage";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginSuccessfull, setLoginSuccessfull] = useState(false);
  const [errorMessage, setErrorMessage] = useState();
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

   const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    return regex.test(password);
  };

  const loginUser = async () => {
    setErrorMessage(null);
    if (!validatePassword(password)) {
      setErrorMessage(
        "Format de mot de passe invalide.\nIl doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un symbole."
      );
      return;
    }

    setLoading(true);

    axios
      .post(import.meta.env.VITE_API_HOST + "/api/user/login", {
        username: username,
        password: password,
      })
      .then((response) => {
        setLoginSuccessfull(true);
        localStorage.setItem("user", JSON.stringify(response.data));
        location.replace("/dashboard");
      })
      .catch((error) => {
        if (error.response && error.response.data && error.response.data.message) {
          setErrorMessage(error.response.data.message);
        } else {
          setErrorMessage("Une erreur de connexion est survenue. Veuillez réessayer.");
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="relative flex w-full min-h-screen items-center justify-center overflow-x-hidden p-4 md:gap-16 lg:gap-32">
      <img className="w-48 h-fit absolute left-6 top-6 md:left-12 md:top-12" src={va_logo} alt="V.A Productions Logo" />

      <div className={`w-full max-w-md flex flex-col font-inter text-sm md:min-w-[400px] ${errorMessage ? 'pt-20' : ''}`}>
        {errorMessage && <ErrorMessage message={errorMessage} />}
        {loginSuccessfull && (
          <p className="bg-green-400 px-6 py-1 w-full">Connecté avec succès</p>
        )}

        {/* HEADER */}
        <div className="font-bold text-4xl md:text-5xl">
          <p className="text-[#3F3F3F]">Bienvenue chez</p>
          <p className="text-white bg-[#3F3F3F] w-fit px-3 py-1 mt-1">
            V.A Productions
          </p>
        </div>
        <p className="max-w-md mt-5 opacity-70">
          Découvrez tous les outils liés à la prospection et facturation pour
          faciliter la prise de contact et de commande
        </p>

        {/* FORMULAIRE */}
        <form
          className="mt-6 flex flex-col gap-5"
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="flex flex-col font-medium text-[15px]">
            Email
            <input
              required
              onChange={(e) => setUsername(e.target.value)}
              className="border-[#3F3F3F] border-[0.75px] border-opacity-15 w-full py-[10px] rounded-[5px] px-2 mt-1"
            />
          </label>

          <label className="flex flex-col font-medium text-[15px]">
            Mot de passe
            <div className="relative">
              <input
                required
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                onBlur={() => setPasswordError("")}
                type={showPassword ? "text" : "password"}
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
            {passwordError && (
              <p className="login-instruction-text">{passwordError}</p>
            )}
          </label>

          {/* BUTTONS */}
          <div className="flex flex-col w-full gap-2 mt-2">
            <button
              className="bg-button w-full py-[14px] active:scale-95 rounded-[5px] text-white flex justify-center items-center"
              onClick={loginUser}
              type="submit"
            >
              {loading && <img className="size-6" src={loading_gif} alt="Chargement" />}
              {!loading && <p>Se connecter</p>}
            </button>
            <button
              className="w-full border-[#5C89E0] active:scale-95 text-[#5C89E0] hover:text-white hover:bg-[#5C89E0] transition-all border-2 py-3 rounded-[5px]"
              onClick={() => {
                location.href = "/mot-de-passe-oublie";
              }}
            >
              Mot de passe oublié ?
            </button>
          </div>
        </form>
      </div>
      <img className="hidden md:block h-fit w-fit max-w-md lg:max-w-lg" src={magazine_img} alt="Magazines" />
      
      <span className="triangle absolute -bottom-60 right-40 blur-md -rotate-45 opacity-70"></span>
      <span className="triangle absolute -top-32 -right-64 scale-75 blur-md rotate-[25deg] opacity-50"></span>
      <span className="w-96 h-96 bg-[#295CC046] -left-32 -bottom-52 absolute rounded-full blur-md rotate-[25deg] opacity-50"></span>
    </div>
  );
};

export default Login;