import { NavLink } from "react-router-dom";

const PageLink = ({ link, icon, text, className, closeNavbar }) => { // <--- PROPRIÉTÉ AJOUTÉE
  const baseClassName =
    "relative flex hover:bg-black hover:bg-opacity-5 opacity-70 hover:opacity-100 hover:scale-105 transition-all items-center rounded-md pr-2 pl-3 py-2 gap-4 text-white";
  const activeClassName = "opacity-100 bg-black bg-opacity-5";

  return (
    <NavLink
      className={({ isActive }) =>
        [className, baseClassName, isActive ? activeClassName : ""]
          .filter(Boolean)
          .join(" ")
      }
      to={link}
      onClick={closeNavbar} // <--- GESTIONNAIRE D'ÉVÉNEMENT AJOUTÉ
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-white" />
          )}
          <img
            className={`size-7 ${isActive ? "opacity-100" : "opacity-80"}`}
            src={icon}
            alt=""
          />
          <p
            className={`text-lg text-white ${
              isActive ? "font-bold opacity-100" : "font-normal opacity-80"
            }`}
          >
            {text}
          </p>
        </>
      )}
    </NavLink>
  );
};

export default PageLink;