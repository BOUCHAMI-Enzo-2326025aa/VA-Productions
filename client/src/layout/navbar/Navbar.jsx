import logo from "../../assets/va-production-logo.png";
import PageLink from "./PageLink";
import dashboardSvg from "../../assets/dashboard-icon.svg";
import contactSvg from "../../assets/contact-icon.svg";
import facturationSvg from "../../assets/facturation-icon.svg";
import calendrierSvg from "../../assets/calendar-icon.svg";
import manageUserSvg from "../../assets/manage-user-icon.svg";
import userGuideSvg from "../../assets/user-guide-icon.svg";
import statsSvg from "../../assets/stats-icon.svg";
import oderSvg from "../../assets/order-icon.svg";
import useAuth from "../../hooks/useAuth";

const Navbar = ({ isOpen, closeNavbar }) => {
  const { isAdmin } = useAuth();

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
        <p className="mt-10 text-sm text-white font-medium opacity-70">MENU</p>
        <div className="flex gap-0 flex-col mt-4">
          <PageLink
            link={"/dashboard"}
            text={"Dashboard"}
            icon={dashboardSvg}
          />
          <PageLink link={"/contacts"} text={"Contacts"} icon={contactSvg} />
          <PageLink
            link={"/invoice"}
            text={"Facturations"}
            icon={facturationSvg}
          />
          <PageLink link={"/order"} text={"Commandes"} icon={oderSvg} />
          <PageLink
            link={"/calendrier"}
            text={"Calendrier"}
            icon={calendrierSvg}
          />
        </div>

        {isAdmin && (
          <>
            <p className="mt-16 text-sm text-white font-medium opacity-70">
              ADMINISTRATION
            </p>
            <div className="mt-4 flex gap-2 flex-col">
              <PageLink
                link={"/admin/user"} 
                text={"Gestion Utilisateur"}
                icon={manageUserSvg}
              />
              <PageLink
                link={"/admin/magazine"}
                text={"Magazines"}
                icon={contactSvg}
              />
              <PageLink
                link={"/admin/stats"}
                text={"Statistiques"}
                icon={statsSvg}
              />
            </div>
          </>
        )}

        <PageLink
          link={"/guide"}
          text={"Guide d'utilisation"}
          icon={userGuideSvg}
          className={"absolute px-2 bottom-16 w-full"}
        />

        <button
          onClick={() => {
            localStorage.removeItem("user");
            window.location.href = "/connexion";
          }}
          className="absolute left-0 bottom-5 w-[90%] mx-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Navbar;