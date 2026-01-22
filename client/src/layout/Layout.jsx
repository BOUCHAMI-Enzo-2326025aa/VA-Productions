import React, { useState } from "react";
import Navbar from "./navbar/Navbar";
import mini_calendar_icon from "../assets/mini-calendar-icon.svg";
import EditableText from "../components/EditableText";
import AiAssistant from "../components/AiAssistant/AiAssistant";

function formatDate(timestamp) {
  const options = { day: "numeric", month: "short", year: "numeric" };
  const date = new Date(timestamp);
  return date.toLocaleDateString("fr-FR", options).replace(".", ".");
}

const Layout = ({ children, pathName }) => {
  const [isNavOpen, setNavOpen] = useState(false);
  const [isEditingPath, setIsEditingPath] = useState(false);

  const handleOpenCloseNavBar = () => {
    setNavOpen(!isNavOpen);
  };

  React.useEffect(() => {
    const readEditMode = () => {
      try {
        return localStorage.getItem("ui:edit-mode") === "true";
      } catch {
        return false;
      }
    };

    const syncEditMode = () => {
      setIsEditingPath(readEditMode());
    };

    const handleEditModeChange = (event) => {
      if (event?.detail && typeof event.detail.isEditing === "boolean") {
        setIsEditingPath(event.detail.isEditing);
        return;
      }
      syncEditMode();
    };

    syncEditMode();
    window.addEventListener("storage", syncEditMode);
    window.addEventListener("ui-edit-mode-change", handleEditModeChange);
    return () => window.removeEventListener("storage", syncEditMode);
  }, []);

  return (
    <div className="flex relative font-inter text-white min-w-screen min-h-screen max-[1024px]:bg-[#E8E9EB] bg-[#1B1B14] overflow-x-hidden">
      <Navbar isOpen={isNavOpen} closeNavbar={handleOpenCloseNavBar} />
      <div className="px-16 pt-12 w-full max-2xl:px-8 pb-6 bg-[#E8E9EB] rounded-tl-2xl relative">
        <div className="flex justify-between max-[550px]:flex-col">
          <div className="flex gap-1 text-main-color items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#5f6368"
              className="min-[1024px]:hidden"
              onClick={handleOpenCloseNavBar}
            >
              <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
            </svg>
            <p className="opacity-70 max-lg:ml-2">V.A. Productions /</p>
            <EditableText
              storageKey={`layout:pathname:${pathName}`}
              defaultValue={pathName}
              isEditing={isEditingPath}
              className="font-semibold"
              inputClassName="font-semibold"
              as="span"
            />
          </div>
          <div className="flex items-center gap-2 opacity-70">
            <p className="text-main-color">{formatDate(Date.now())}</p>
            <img src={mini_calendar_icon}></img>
          </div>
        </div>
        {children}
        <AiAssistant />
      </div>
    </div>
  );
};

export default Layout;
