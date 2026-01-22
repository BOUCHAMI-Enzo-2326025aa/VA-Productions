import { useState, useEffect } from "react";
import axios from "axios";
import { User, Lock, Save, Eye, EyeOff } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import EditableText from "../../components/EditableText";
import useAuth from "../../hooks/useAuth";
import { getPageContent, updatePageContent } from "../../utils/pageContentApi";

const readStoredValue = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw;
  } catch {
    return fallback;
  }
};

const Settings = () => {
  const { isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, type: "", message: "" });
  const [profileTitle, setProfileTitle] = useState(() =>
    readStoredValue("settings:profile:title", "Informations du profil")
  );
  const [nameLabel, setNameLabel] = useState(() =>
    readStoredValue("settings:profile:name", "Nom")
  );
  const [firstNameLabel, setFirstNameLabel] = useState(() =>
    readStoredValue("settings:profile:firstName", "Prénom")
  );
  const [emailLabel, setEmailLabel] = useState(() =>
    readStoredValue("settings:profile:email", "Email")
  );
  const [emailHint, setEmailHint] = useState(() =>
    readStoredValue("settings:profile:emailHint", "L'email ne peut pas être modifié")
  );
  const [namePlaceholder, setNamePlaceholder] = useState(() =>
    readStoredValue("settings:profile:namePlaceholder", "Votre nom")
  );
  const [firstNamePlaceholder, setFirstNamePlaceholder] = useState(() =>
    readStoredValue("settings:profile:firstNamePlaceholder", "Votre prénom")
  );
  const [profileSaveLabel, setProfileSaveLabel] = useState(() =>
    readStoredValue("settings:profile:save", "Enregistrer les modifications")
  );
  const [profileSavingLabel, setProfileSavingLabel] = useState(() =>
    readStoredValue("settings:profile:saving", "Enregistrement...")
  );
  const [passwordTitle, setPasswordTitle] = useState(() =>
    readStoredValue("settings:password:title", "Changer le mot de passe")
  );
  const [currentPasswordLabel, setCurrentPasswordLabel] = useState(() =>
    readStoredValue("settings:password:current", "Mot de passe actuel")
  );
  const [newPasswordLabel, setNewPasswordLabel] = useState(() =>
    readStoredValue("settings:password:new", "Nouveau mot de passe")
  );
  const [confirmPasswordLabel, setConfirmPasswordLabel] = useState(() =>
    readStoredValue("settings:password:confirm", "Confirmer le nouveau mot de passe")
  );
  const [currentPasswordPlaceholder, setCurrentPasswordPlaceholder] = useState(() =>
    readStoredValue("settings:password:currentPlaceholder", "Entrez votre mot de passe actuel")
  );
  const [newPasswordPlaceholder, setNewPasswordPlaceholder] = useState(() =>
    readStoredValue("settings:password:newPlaceholder", "Entrez votre nouveau mot de passe")
  );
  const [confirmPasswordPlaceholder, setConfirmPasswordPlaceholder] = useState(() =>
    readStoredValue("settings:password:confirmPlaceholder", "Confirmez votre nouveau mot de passe")
  );
  const [passwordHint, setPasswordHint] = useState(() =>
    readStoredValue(
      "settings:password:hint",
      "Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 symbole"
    )
  );
  const [passwordSaveLabel, setPasswordSaveLabel] = useState(() =>
    readStoredValue("settings:password:save", "Changer le mot de passe")
  );
  const [passwordSavingLabel, setPasswordSavingLabel] = useState(() =>
    readStoredValue("settings:password:saving", "Changement en cours...")
  );
  const NAVBAR_DEFAULTS = {
    menu: "MENU",
    dashboard: "Dashboard",
    contacts: "Contacts",
    orders: "Commandes",
    invoices: "Facturation",
    calendar: "Calendrier",
    adminSection: "Administration",
    adminUsers: "Gestion Utilisateur",
    adminCharge: "Comptabilité",
    adminMagazines: "Magazines",
    adminStats: "Statistiques",
  };

  const [menuLabel, setMenuLabel] = useState(NAVBAR_DEFAULTS.menu);
  const [dashboardLabel, setDashboardLabel] = useState(NAVBAR_DEFAULTS.dashboard);
  const [contactsLabel, setContactsLabel] = useState(NAVBAR_DEFAULTS.contacts);
  const [ordersLabel, setOrdersLabel] = useState(NAVBAR_DEFAULTS.orders);
  const [invoicesLabel, setInvoicesLabel] = useState(NAVBAR_DEFAULTS.invoices);
  const [calendarLabel, setCalendarLabel] = useState(NAVBAR_DEFAULTS.calendar);
  const [adminSectionLabel, setAdminSectionLabel] = useState(NAVBAR_DEFAULTS.adminSection);
  const [adminUsersLabel, setAdminUsersLabel] = useState(NAVBAR_DEFAULTS.adminUsers);
  const [adminChargeLabel, setAdminChargeLabel] = useState(NAVBAR_DEFAULTS.adminCharge);
  const [adminMagazinesLabel, setAdminMagazinesLabel] = useState(NAVBAR_DEFAULTS.adminMagazines);
  const [adminStatsLabel, setAdminStatsLabel] = useState(NAVBAR_DEFAULTS.adminStats);
  
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
    if (!isAdmin) {
      setIsEditing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    let isActive = true;

    const keySetters = [
      { key: "settings:profile:title", setter: setProfileTitle },
      { key: "settings:profile:name", setter: setNameLabel },
      { key: "settings:profile:firstName", setter: setFirstNameLabel },
      { key: "settings:profile:email", setter: setEmailLabel },
      { key: "settings:profile:emailHint", setter: setEmailHint },
      { key: "settings:profile:namePlaceholder", setter: setNamePlaceholder },
      { key: "settings:profile:firstNamePlaceholder", setter: setFirstNamePlaceholder },
      { key: "settings:profile:save", setter: setProfileSaveLabel },
      { key: "settings:profile:saving", setter: setProfileSavingLabel },
      { key: "settings:password:title", setter: setPasswordTitle },
      { key: "settings:password:current", setter: setCurrentPasswordLabel },
      { key: "settings:password:new", setter: setNewPasswordLabel },
      { key: "settings:password:confirm", setter: setConfirmPasswordLabel },
      { key: "settings:password:currentPlaceholder", setter: setCurrentPasswordPlaceholder },
      { key: "settings:password:newPlaceholder", setter: setNewPasswordPlaceholder },
      { key: "settings:password:confirmPlaceholder", setter: setConfirmPasswordPlaceholder },
      { key: "settings:password:hint", setter: setPasswordHint },
      { key: "settings:password:save", setter: setPasswordSaveLabel },
      { key: "settings:password:saving", setter: setPasswordSavingLabel },
    ];

    const loadSettingsContent = async () => {
      const results = await Promise.all(
        keySetters.map(async ({ key }) => {
          try {
            const fields = await getPageContent(key);
            return { key, value: fields?.value };
          } catch {
            return { key, value: null };
          }
        })
      );

      if (!isActive) return;

      results.forEach(({ key, value }) => {
        if (value === null || value === undefined) return;
        const match = keySetters.find((item) => item.key === key);
        if (match?.setter) {
          match.setter(value);
        }
      });
    };

    loadSettingsContent();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    const loadNavbarLabels = async () => {
      try {
        const fields = await getPageContent("navbar");
        if (!isActive) return;
        setMenuLabel(fields?.menu ?? NAVBAR_DEFAULTS.menu);
        setDashboardLabel(fields?.dashboard ?? NAVBAR_DEFAULTS.dashboard);
        setContactsLabel(fields?.contacts ?? NAVBAR_DEFAULTS.contacts);
        setOrdersLabel(fields?.orders ?? NAVBAR_DEFAULTS.orders);
        setInvoicesLabel(fields?.invoices ?? NAVBAR_DEFAULTS.invoices);
        setCalendarLabel(fields?.calendar ?? NAVBAR_DEFAULTS.calendar);
        setAdminSectionLabel(fields?.adminSection ?? NAVBAR_DEFAULTS.adminSection);
        setAdminUsersLabel(fields?.adminUsers ?? NAVBAR_DEFAULTS.adminUsers);
        setAdminChargeLabel(fields?.adminCharge ?? NAVBAR_DEFAULTS.adminCharge);
        setAdminMagazinesLabel(fields?.adminMagazines ?? NAVBAR_DEFAULTS.adminMagazines);
        setAdminStatsLabel(fields?.adminStats ?? NAVBAR_DEFAULTS.adminStats);
      } catch {
        // Ignore load errors
      }
    };

    loadNavbarLabels();

    return () => {
      isActive = false;
    };
  }, []);

  const showSnackbar = (type, message) => {
    setSnackbar({ open: true, type, message });
    setTimeout(() => {
      setSnackbar({ open: false, type: "", message: "" });
    }, 3000);
  };

  const updateNavbarLabel = async (field, value) => {
    try {
      await updatePageContent("navbar", { [field]: value });
      window.dispatchEvent(new Event("navbar-labels-change"));
    } catch {
      // Ignore save errors
    }
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

      <PageHeader
        title="Paramètres"
        description="Gérez vos informations personnelles et votre sécurité"
        storageKey="page-header:parametres"
        className="mt-10"
        editMode={isEditing}
        onEditModeChange={setIsEditing}
        canEdit={isAdmin}
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section Profil */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="text-[#3F3F3F]" size={24} />
            <EditableText
              storageKey="settings:profile:title"
              defaultValue={profileTitle}
              isEditing={isEditing && isAdmin}
              onValueChange={setProfileTitle}
              className="text-xl font-semibold"
              inputClassName="text-xl font-semibold"
              as="h2"
            />
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <EditableText
                storageKey="settings:profile:name"
                defaultValue={nameLabel}
                isEditing={isEditing && isAdmin}
                onValueChange={setNameLabel}
                className="block font-semibold mb-2"
                inputClassName="text-sm"
                as="label"
              />
              <input
                type="text"
                value={profileForm.nom}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, nom: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={namePlaceholder}
                required
              />
            </div>

            <div>
              <EditableText
                storageKey="settings:profile:firstName"
                defaultValue={firstNameLabel}
                isEditing={isEditing && isAdmin}
                onValueChange={setFirstNameLabel}
                className="block font-semibold mb-2"
                inputClassName="text-sm"
                as="label"
              />
              <input
                type="text"
                value={profileForm.prenom}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, prenom: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={firstNamePlaceholder}
                required
              />
            </div>

            <div>
              <EditableText
                storageKey="settings:profile:email"
                defaultValue={emailLabel}
                isEditing={isEditing && isAdmin}
                onValueChange={setEmailLabel}
                className="block font-semibold mb-2 opacity-60"
                inputClassName="text-sm"
                as="label"
              />
              <input
                type="email"
                value={user?.user?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed opacity-60"
              />
              <EditableText
                storageKey="settings:profile:emailHint"
                defaultValue={emailHint}
                isEditing={isEditing && isAdmin}
                onValueChange={setEmailHint}
                className="text-xs text-gray-500 mt-1"
                inputClassName="text-xs"
                as="p"
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full bg-[#3F3F3F] text-white py-2 rounded-lg font-semibold hover:bg-opacity-80 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {profileLoading ? profileSavingLabel : profileSaveLabel}
            </button>
          </form>
        </div>

        {/* Section Mot de passe */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="text-[#3F3F3F]" size={24} />
            <EditableText
              storageKey="settings:password:title"
              defaultValue={passwordTitle}
              isEditing={isEditing && isAdmin}
              onValueChange={setPasswordTitle}
              className="text-xl font-semibold"
              inputClassName="text-xl font-semibold"
              as="h2"
            />
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <EditableText
                storageKey="settings:password:current"
                defaultValue={currentPasswordLabel}
                isEditing={isEditing && isAdmin}
                onValueChange={setCurrentPasswordLabel}
                className="block font-semibold mb-2"
                inputClassName="text-sm"
                as="label"
              />
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
                  placeholder={currentPasswordPlaceholder}
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
              <EditableText
                storageKey="settings:password:new"
                defaultValue={newPasswordLabel}
                isEditing={isEditing && isAdmin}
                onValueChange={setNewPasswordLabel}
                className="block font-semibold mb-2"
                inputClassName="text-sm"
                as="label"
              />
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
                  placeholder={newPasswordPlaceholder}
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
              <EditableText
                storageKey="settings:password:hint"
                defaultValue={passwordHint}
                isEditing={isEditing && isAdmin}
                onValueChange={setPasswordHint}
                className="text-xs text-gray-500 mt-1"
                inputClassName="text-xs"
                as="p"
              />
            </div>

            <div>
              <EditableText
                storageKey="settings:password:confirm"
                defaultValue={confirmPasswordLabel}
                isEditing={isEditing && isAdmin}
                onValueChange={setConfirmPasswordLabel}
                className="block font-semibold mb-2"
                inputClassName="text-sm"
                as="label"
              />
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
                  placeholder={confirmPasswordPlaceholder}
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
              {passwordLoading ? passwordSavingLabel : passwordSaveLabel}
            </button>
          </form>
        </div>
      </div>

      {isAdmin && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#3F3F3F"
            >
              <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
            </svg>
            <h2 className="text-xl font-semibold">Navigation (Navbar)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2">Menu</label>
              <input
                value={menuLabel}
                onChange={(e) => {
                  setMenuLabel(e.target.value);
                  updateNavbarLabel("menu", e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Dashboard</label>
              <input
                value={dashboardLabel}
                onChange={(e) => {
                  setDashboardLabel(e.target.value);
                  updateNavbarLabel("dashboard", e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Contacts</label>
              <input
                value={contactsLabel}
                onChange={(e) => {
                  setContactsLabel(e.target.value);
                  updateNavbarLabel("contacts", e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Commandes</label>
              <input
                value={ordersLabel}
                onChange={(e) => {
                  setOrdersLabel(e.target.value);
                  updateNavbarLabel("orders", e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Facturation</label>
              <input
                value={invoicesLabel}
                onChange={(e) => {
                  setInvoicesLabel(e.target.value);
                  updateNavbarLabel("invoices", e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-2">Calendrier</label>
              <input
                value={calendarLabel}
                onChange={(e) => {
                  setCalendarLabel(e.target.value);
                  updateNavbarLabel("calendar", e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Administration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-2">Titre section</label>
                <input
                  value={adminSectionLabel}
                  onChange={(e) => {
                    setAdminSectionLabel(e.target.value);
                    updateNavbarLabel("adminSection", e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Gestion Utilisateur</label>
                <input
                  value={adminUsersLabel}
                  onChange={(e) => {
                    setAdminUsersLabel(e.target.value);
                    updateNavbarLabel("adminUsers", e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Comptabilité</label>
                <input
                  value={adminChargeLabel}
                  onChange={(e) => {
                    setAdminChargeLabel(e.target.value);
                    updateNavbarLabel("adminCharge", e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Magazines</label>
                <input
                  value={adminMagazinesLabel}
                  onChange={(e) => {
                    setAdminMagazinesLabel(e.target.value);
                    updateNavbarLabel("adminMagazines", e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">Statistiques</label>
                <input
                  value={adminStatsLabel}
                  onChange={(e) => {
                    setAdminStatsLabel(e.target.value);
                    updateNavbarLabel("adminStats", e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
