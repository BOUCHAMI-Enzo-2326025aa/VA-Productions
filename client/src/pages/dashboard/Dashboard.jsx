import { useState } from "react";
import LinkList from "./linkList/LinkList";
import ContactList from "./contactList/ContactList";
import FactureList from "./factureList/FactureList";
import { ClientChart } from "./clientChart/ClientChart";
import useAuth from "../../hooks/useAuth";
import PageHeader from "../../components/PageHeader";

const Dashboard = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { user } = useAuth();

  return (
    <>
      <PageHeader
        title={`Bonjour${user?.prenom ? `, ${user.prenom}` : ""}`}
        description="Bienvenue sur l'application de V.A Productions"
        storageKey="page-header:dashboard"
        className="pt-3"
        titleClassName="text-[40px] font-[700] max-[680px]:text-2xl leading-tight"
        descriptionClassName="text-[20px] opacity-80 max-[680px]:text-sm"
      />
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
