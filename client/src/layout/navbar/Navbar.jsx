import { useState, useEffect } from "react";
import logo from "../../assets/va-production-logo.png";
import PageLink from "./PageLink";
import dashboardSvg from "../../assets/dashboard-icon.svg";
import contactSvg from "../../assets/contact-icon.svg";
import chargeSvg from "../../assets/charge-icon.svg";
import facturationSvg from "../../assets/facturation-icon.svg";
import calendrierSvg from "../../assets/calendar-icon.svg";
import manageUserSvg from "../../assets/manage-user-icon.svg";
import userGuideSvg from "../../assets/user-guide-icon.svg";
import statsSvg from "../../assets/stats-icon.svg";
import oderSvg from "../../assets/order-icon.svg";
import powerIconSvg from "../../assets/power-icon.svg";
import gearIconSvg from "../../assets/gear-icon.svg";
import useAuth from "../../hooks/useAuth";

const Navbar = ({ isOpen, closeNavbar }) => {
 const { isAdmin } = useAuth();

 const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(() => {
  const saved = localStorage.getItem("adminMenuOpen");
  return saved === "true";
 });

 useEffect(() => {
  localStorage.setItem("adminMenuOpen", isAdminMenuOpen);
 }, [isAdminMenuOpen]);

 const toggleAdminMenu = () => {
  setIsAdminMenuOpen((prev) => !prev);
 };

 return (
  <div
   className={
    "sticky left-0 top-0 bg-[#1B1B14] min-w-[300px] w-[300px] max-h-screen flex flex-col px-8 py-10 max-2xl:min-w-[250px] max-lg:-translate-x-[100%] z-[99] max-lg:fixed max-lg:w-full transition-all " +
    (isOpen && " max-[1024px]:translate-x-[0%] max-[1024px]:min-h-screen ")
   }
  >
   <div className="fixed left-0 top-0 px-6 py-6 h-screen ">
    <div className="flex justify-between items-center  left-0 top-0">
     <a href="/dashboard">
      <img
       className="w-full max-w-[230px] mt-5 h-auto invert opacity-80"
       src={logo}
      />
     </a>
     <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="#5f6368"
      onClick={closeNavbar}
      className="mr-6 min-[1024px]:hidden"
     >
      <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
     </svg>
    </div>
    <p className="mt-6 text-sm text-white font-medium opacity-70">MENU</p>
    <div className="flex gap-0 flex-col mt-4">
     <PageLink
      link={"/dashboard"}
      text={"Dashboard"}
      icon={dashboardSvg}
      closeNavbar={closeNavbar}
     />
     <PageLink
      link={"/contacts"}
      text={"Contacts"}
      icon={contactSvg}
      closeNavbar={closeNavbar}
     />
     <PageLink
      link={"/order"}
      text={"Commandes"}
      icon={oderSvg}
      closeNavbar={closeNavbar}
     />
     <PageLink
      link={"/invoice"}
      text={"Facturation"}
      icon={facturationSvg}
      closeNavbar={closeNavbar}
     />
     <PageLink
      link={"/calendrier"}
      text={"Calendrier"}
      icon={calendrierSvg}
      closeNavbar={closeNavbar}
     />
    </div>

    {isAdmin && (
     <>
      <div className="mt-2">
       <button
        type="button"
        onClick={toggleAdminMenu}
        className="flex w-full items-center justify-between rounded-md px-2 py-2 text-white opacity-70 hover:bg-black hover:bg-opacity-5 hover:opacity-100 hover:scale-105 transition-all"
        aria-expanded={isAdminMenuOpen}
       >
        <span className="text-lg font-normal">Administration</span>
        <svg
         className={`size-5 transition-transform ${isAdminMenuOpen ? "rotate-180" : ""
          }`}
         xmlns="http://www.w3.org/2000/svg"
         viewBox="0 -960 960 960"
         fill="currentColor"
        >
         <path d="M480-360 226-614l56-56 198 198 198-198 56 56-254 254Z" />
        </svg>
       </button>
       {isAdminMenuOpen && (
        <div className="ml-4 flex flex-col gap-1">
         <PageLink
          link={"/admin/user"}
          text={"Gestion Utilisateur"}
          icon={manageUserSvg}
          closeNavbar={closeNavbar}
         />
         <PageLink
          link={"/admin/charge"}
          text={"Comptabilité"}
          icon={chargeSvg}
          closeNavbar={closeNavbar}
         />
         <PageLink
          link={"/admin/magazine"}
          text={"Magazines"}
          icon={contactSvg}
          closeNavbar={closeNavbar}
         />
         <PageLink
          link={"/admin/stats"}
          text={"Statistiques"}
          icon={statsSvg}
          closeNavbar={closeNavbar}
         />
        </div>
       )}
      </div>
     </>
    )}

    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-4">
     <button
      onClick={async () => {
       try {
        // Appel au serveur pour supprimer le cookie
        await axios.post(import.meta.env.VITE_API_HOST + "/api/user/logout");
       } catch (error) {
        console.error("Erreur lors de la déconnexion", error);
       } finally {
        localStorage.removeItem("user");
        window.location.href = "/connexion";
       }
      }}
      className="p-2 hover:bg-black hover:bg-opacity-10 rounded-lg transition group"
      title="Déconnexion"
     >
      <img src={powerIconSvg} alt="Déconnexion" className="w-10 h-10 opacity-70 group-hover:opacity-100 transition" />
     </button>

     <a
      href="/settings"
      className="p-2 hover:bg-black hover:bg-opacity-10 rounded-lg transition group"
      title="Paramètres"
     >
      <img src={gearIconSvg} alt="Paramètres" className="w-10 h-10 opacity-70 group-hover:opacity-100 transition" />
     </a>

     <a
      href="/guide"
      className="p-2 hover:bg-black hover:bg-opacity-10 rounded-lg transition group"
      title="Guide d'utilisation"
     >
      <img src={userGuideSvg} alt="Guide d'utilisation" className="w-10 h-10 opacity-70 group-hover:opacity-100 transition" />
     </a>
    </div>
   </div>
  </div>
 );
};

export default Navbar;