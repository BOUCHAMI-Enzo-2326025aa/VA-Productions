import { useState } from "react";
import LinkList from "./linkList/LinkList";
import ContactList from "./contactList/ContactList";
import FactureList from "./factureList/FactureList";
import { ClientChart } from "./clientChart/ClientChart";
import { useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import PageHeader from "../../components/PageHeader";

const Dashboard = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      setIsEditing(false);
    }
  }, [isAdmin]);

  return (
    <>
      <PageHeader
        title="Bonjour"
        titleSuffix={user?.prenom ? `, ${user.prenom}` : ""}
        description="Bienvenue sur l'application de V.A Productions"
        storageKey="page-header:dashboard"
        className="pt-3"
        titleClassName="font-inter text-[#3F3F3F] !text-[40px] font-[700] max-[680px]:!text-2xl leading-tight"
        descriptionClassName="font-inter text-[#3F3F3F] !text-[20px] opacity-80 max-[680px]:!text-sm"
        editMode={isEditing}
        onEditModeChange={setIsEditing}
        canEdit={isAdmin}
      />
      <LinkList isEditing={isEditing && isAdmin} />
      <div className="mt-4">
        <ClientChart isEditing={isEditing && isAdmin} />
      </div>
      <div className="flex mt-4 gap-4 max-[680px]:flex-col">
        <ContactList isEditing={isEditing && isAdmin} />
        <FactureList isEditing={isEditing && isAdmin} />
      </div>
    </>
  );
};

export default Dashboard;
