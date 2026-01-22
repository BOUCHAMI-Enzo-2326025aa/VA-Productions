import { useEffect, useState } from "react";
import FactureCard from "./FactureCard";
import axios from "axios";
import EditableText from "../../../components/EditableText";

const FactureList = ({ isEditing = false }) => {
  const [factureList, setFactureList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoices = async () => {
    setIsLoading(true);
    await axios
      .get(import.meta.env.VITE_API_HOST + "/api/invoice/")
      .then((res) => {
        setFactureList(res.data.slice(0, 3));
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <div className="bg-white w-[50%] py-5 px-8 h-full rounded-[15px] max-[680px]:w-full">
      <div className="flex justify-between items-center">
        <EditableText
          storageKey="dashboard:invoices:title"
          defaultValue="Dernières Factures"
          isEditing={isEditing}
          className="text-main-color text-xl font-semibold max-[850px]:text-sm"
          inputClassName="text-xl font-semibold max-[850px]:text-sm"
        />
        {isEditing ? (
          <EditableText
            storageKey="dashboard:invoices:cta"
            defaultValue="Voir plus"
            isEditing={isEditing}
            className="text-secondary-color text-sm font-semibold max-[850px]:text-xs"
            inputClassName="text-sm font-semibold max-[850px]:text-xs"
            as="span"
          />
        ) : (
          <a
            href="/invoice"
            className="text-secondary-color text-sm font-semibold max-[850px]:text-xs"
          >
            <EditableText
              storageKey="dashboard:invoices:cta"
              defaultValue="Voir plus"
              isEditing={false}
              as="span"
            />
          </a>
        )}
      </div>
      <div className="flex flex-col gap-2 mt-5">
        {isLoading ? (
          <div className="flex flex-row gap-2 w-[100%] items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-500 animate-bounce"></div>
            <div className="w-3 h-3 rounded-full bg-gray-500 animate-bounce [animation-delay:-.3s]"></div>
            <div className="w-3 h-3 rounded-full bg-gray-500 animate-bounce [animation-delay:-.5s]"></div>
          </div>
        ) : (
          factureList.map((facture, index) => (
            <FactureCard
              key={index}
              name={facture.number + "_" + facture.entreprise.toUpperCase()}
              price={facture.totalPrice}
              client={facture.entreprise}
              isLast={index === factureList.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default FactureList;
