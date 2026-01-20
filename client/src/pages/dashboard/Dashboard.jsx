import { useState } from "react";
import LinkList from "./linkList/LinkList";
import ContactList from "./contactList/ContactList";
import FactureList from "./factureList/FactureList";
import { ClientChart } from "./clientChart/ClientChart";
import useAuth from "../../hooks/useAuth";
import usePageContent from "../../hooks/usePageContent";

const Dashboard = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { user } = useAuth();
  const { content } = usePageContent("dashboard");

  return (
    <>
      <div className="flex flex-col pt-3">
        <p className="font-inter text-[#3F3F3F] text-[40px] font-[700] max-[680px]:text-2xl">
          Bonjour{user?.prenom ? `, ${user.prenom}` : ""}
        </p>
        <p className="font-inter text-[#3F3F3F] text-[20px] opacity-80 max-[680px]:text-sm">
          {content.text}
        </p>
      </div>
      <LinkList />
      <div className="mt-4">
        <ClientChart />
      </div>
      <div className="flex mt-4 gap-4 max-[680px]:flex-col">
        <ContactList />
        <FactureList />
      </div>
    </>
  );
};

export default Dashboard;
