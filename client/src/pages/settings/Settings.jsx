import { useState, useEffect } from "react";
import axios from "axios";
import { User, Lock, Save, Eye, EyeOff } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import { PAGE_CONTENT_CONFIG, PAGE_KEYS } from "../../content/pageContentConfig";

const Settings = () => {
  const [user, setUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, type: "", message: "" });

  const { isAdmin } = useAuth();

  // Admin - éditeur de contenu des pages
  const [selectedPageKey, setSelectedPageKey] = useState("dashboard");
  const [accountingSubPageKey, setAccountingSubPageKey] = useState("accountingCharges");
  const [pageEditorForm, setPageEditorForm] = useState({});
  const [pageEditorLoading, setPageEditorLoading] = useState(false);
  const [pageEditorFetching, setPageEditorFetching] = useState(false);

  const isAccountingGroup = selectedPageKey === "accounting";
  const effectivePageKey = isAccountingGroup ? accountingSubPageKey : selectedPageKey;
  
  // État pour le formulaire de profil
  const [profileForm, setProfileForm] = useState({
    nom: "",
    prenom: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // État pour le formulaire de mot de passe
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Récupérer les informations utilisateur depuis localStorage
    const userString = localStorage.getItem("user");
    if (userString) {
      const userData = JSON.parse(userString);
      setUser(userData);
      setProfileForm({
        nom: userData.user?.nom || "",
        prenom: userData.user?.prenom || "",
      });

    }
  }, []);

  useEffect(() => {
    const fetchPageContent = async () => {
      if (!isAdmin) return;
      if (!String(effectivePageKey || "").trim()) return;
      const config = PAGE_CONTENT_CONFIG?.[effectivePageKey];
      if (!config) return;
      const defaults = config?.defaults || {};
      const allowedFieldKeys = new Set(Object.keys(config?.fields || {}));

      setPageEditorFetching(true);
      try {
        const res = await axios.get(`/api/page-content/${effectivePageKey}`);
        const fields = res?.data?.fields || {};
        const merged = { ...defaults, ...fields };
        // Only keep fields declared as editable in config
        const filtered = {};
        for (const key of Object.keys(merged)) {
          if (allowedFieldKeys.has(key)) {
            filtered[key] = merged[key];
          }
        }
        // Ensure all editable fields exist in state (even if empty)
        for (const key of allowedFieldKeys) {
          if (filtered[key] === undefined) filtered[key] = defaults[key] ?? "";
        }
        setPageEditorForm(filtered);
      } catch (error) {
        console.error("Erreur chargement contenu page:", error);
        showSnackbar("error", "Impossible de charger le contenu de la page");
      } finally {
        setPageEditorFetching(false);
      }
    };

    fetchPageContent();
  }, [effectivePageKey, isAdmin]);

  const handleSavePageContent = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const config = PAGE_CONTENT_CONFIG?.[effectivePageKey];
    if (!config) return;
    const allowedFieldKeys = Object.keys(config?.fields || {});
    const payload = {};
    for (const key of allowedFieldKeys) {
      payload[key] = pageEditorForm?.[key] ?? "";
    }

    setPageEditorLoading(true);
    try {
      await axios.put(`/api/page-content/${effectivePageKey}`, {
        fields: payload,
      });
      showSnackbar("success", "Contenu mis à jour");
    } catch (error) {
      console.error("Erreur sauvegarde contenu page:", error);
      showSnackbar("error", error.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally {
      setPageEditorLoading(false);
    }
  };

  const showSnackbar = (type, message) => {
    setSnackbar({ open: true, type, message });
    setTimeout(() => {
      setSnackbar({ open: false, type: "", message: "" });
    }, 3000);
  };


  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!profileForm.nom.trim() || !profileForm.prenom.trim()) {
      showSnackbar("error", "Le nom et le prénom sont requis");
      return;
    }

    setProfileLoading(true);

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_HOST}/api/user/profile`,
        {
          nom: profileForm.nom,
          prenom: profileForm.prenom,
        }
      );

      // Mettre à jour le localStorage avec les nouvelles informations
      const updatedUser = { ...user, ...response.data.user, token: response.data.token };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Mettre à jour le header axios avec le nouveau token
      axios.defaults.headers.common["Authorization"] = response.data.token;

      showSnackbar("success", "Profil mis à jour avec succès");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      showSnackbar("error", error.response?.data?.erreur || "Erreur lors de la mise à jour du profil");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showSnackbar("error", "Tous les champs sont requis");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showSnackbar("error", "Les nouveaux mots de passe ne correspondent pas");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      showSnackbar("error", "Le nouveau mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setPasswordLoading(true);

    try {
      await axios.put(
        `${import.meta.env.VITE_API_HOST}/api/user/password`,
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }
      );

      showSnackbar("success", "Mot de passe changé avec succès");
      
      // Réinitialiser le formulaire
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Erreur lors du changement de mot de passe:", error);
      showSnackbar("error", error.response?.data?.erreur || "Erreur lors du changement de mot de passe");
    } finally {
      setPasswordLoading(false);
    }
  };

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

      <div className="mt-10">
        <p className="font-bold text-lg leading-3">Paramètres</p>
        <p className="opacity-80 mt-2">
          Gérez vos informations personnelles et votre sécurité
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Profil */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="text-[#3F3F3F]" size={24} />
            <h2 className="text-xl font-semibold">Informations du profil</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold mb-2">Nom</label>
              <input
                type="text"
                value={profileForm.nom}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, nom: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Votre nom"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Prénom</label>
              <input
                type="text"
                value={profileForm.prenom}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, prenom: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Votre prénom"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-2 opacity-60">Email</label>
              <input
                type="email"
                value={user?.user?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed opacity-60"
              />
              <p className="text-xs text-gray-500 mt-1">
                L'email ne peut pas être modifié
              </p>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full bg-[#3F3F3F] text-white py-2 rounded-lg font-semibold hover:bg-opacity-80 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {profileLoading ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </form>
        </div>

        {/* Section Mot de passe */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="text-[#3F3F3F]" size={24} />
            <h2 className="text-xl font-semibold">Changer le mot de passe</h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold mb-2">
                Mot de passe actuel
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Entrez votre mot de passe actuel"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Entrez votre nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 symbole
              </p>
            </div>

            <div>
              <label className="block font-semibold mb-2">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirmez votre nouveau mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock size={18} />
              {passwordLoading ? "Changement en cours..." : "Changer le mot de passe"}
            </button>
          </form>
        </div>
      </div>

      {isAdmin && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-2">
            <Save className="text-[#3F3F3F]" size={24} />
            <h2 className="text-xl font-semibold">Éditeur de pages</h2>
          </div>
          <p className="opacity-80 mb-6">Modifier uniquement les titres et textes statiques.</p>

          <form onSubmit={handleSavePageContent} className="space-y-4">
            <div>
              <label className="block font-semibold mb-2">Page</label>
              <select
                value={selectedPageKey}
                onChange={(e) => setSelectedPageKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={pageEditorFetching}
              >
                {PAGE_KEYS.filter((key) => key !== "accountingCharges" && key !== "accountingResult").map(
                  (key) => (
                    <option key={key} value={key}>
                      {PAGE_CONTENT_CONFIG[key]?.label || key}
                    </option>
                  )
                )}
                <option value="accounting">Comptabilité</option>
              </select>
            </div>

            {selectedPageKey === "accounting" && (
              <div>
                <label className="block font-semibold mb-2">Sous-page</label>
                <select
                  value={accountingSubPageKey}
                  onChange={(e) => setAccountingSubPageKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={pageEditorFetching}
                >
                  <option value="accountingCharges">Saisie des charges</option>
                  <option value="accountingResult">Compte de résultat</option>
                </select>
              </div>
            )}

            {Object.entries(PAGE_CONTENT_CONFIG[effectivePageKey]?.fields || {}).map(
              ([fieldKey, meta]) => {
                const label = meta?.label || fieldKey;
                const type = meta?.type || "text";
                const value = pageEditorForm?.[fieldKey] ?? "";

                if (type === "textarea") {
                  return (
                    <div key={fieldKey}>
                      <label className="block font-semibold mb-2">{label}</label>
                      <textarea
                        value={value}
                        onChange={(e) =>
                          setPageEditorForm((p) => ({ ...p, [fieldKey]: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                        placeholder={label}
                        disabled={pageEditorFetching}
                      />
                    </div>
                  );
                }

                return (
                  <div key={fieldKey}>
                    <label className="block font-semibold mb-2">{label}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        setPageEditorForm((p) => ({ ...p, [fieldKey]: e.target.value }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={label}
                      disabled={pageEditorFetching}
                    />
                  </div>
                );
              }
            )}

            <button
              type="submit"
              disabled={pageEditorLoading || pageEditorFetching}
              className="w-full bg-[#3F3F3F] text-white py-2 rounded-lg font-semibold hover:bg-opacity-80 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {pageEditorLoading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default Settings;
