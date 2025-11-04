import { useEffect, useState } from "react";
import InvoiceButton from "../../component/InvoiceButton";
import CreationSectionTitle from "../../CreationSectionTitle";
import Support from "./Support";
import "./invoiceSupport.css";
import ambition_sud from "../../../../assets/supports/ambition-sud.png";
import roses_en_provence from "../../../../assets/supports/roses-en-provence.png";
import rouges_et_blanc from "../../../../assets/supports/rouges-et-blancs.png";
import w_mag from "../../../../assets/supports/w-mag.png";

const InvoiceSupportChoice = ({
  nextPageFunction,
  previousPageFunction,
  createNewSupport,
  createdSupports,
  deleteSupport,
}) => {
  const [supportList, setSupportList] = useState([
    { name: "WMag", image: w_mag },
    { name: "Rouges et Blancs", image: rouges_et_blanc },
    { name: "AmbitionSud", image: ambition_sud },
    { name: "Roses en Provence", image: roses_en_provence },
  ]);

  const [libelle, setLibelle] = useState("");
  const [supportNumber, setSupportNumber] = useState(0);
  const [price, setPrice] = useState(0);
  const [selectedSupport, setSelectedSupport] = useState(null);

  const [isCreatingNewSupport, setIsCreatingNewSupport] = useState(false);

  const handleSupportSelection = (support) => {
    setSelectedSupport(support);
    console.log(support);
  };

  return (
    <div className="py-8 px-9 page-appear-animation">
      <CreationSectionTitle
        title={"Support à facturer"}
        subtitle={"Indiquez le suport sur lequel se portera la facturation"}
      />

      <div className="mt-6 flex gap-2">
        {!isCreatingNewSupport &&
          createdSupports &&
          createdSupports.map((support, index) => (
            <div
              key={index}
              className="size-44 rounded-[5px] flex flex-col items-center relative"
            >
              <svg
                onClick={() => deleteSupport(index)}
                xmlns="http://www.w3.org/2000/svg"
                className="size-6 fill-red-400 bg-black rounded-full cursor-pointer bg-opacity-50 absolute right-3 top-3 z-10"
                viewBox="0 -960 960 960"
              >
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
              </svg>
              <img
                className="w-full h-full object-cover rounded-[5px]"
                src={support.image}
              />
              <p className=" absolute -bottom-[33px] left-[50%] text-[#3F3F3F] -translate-x-[50%] font-medium">
                {support.name}
              </p>
            </div>
          ))}
        {!isCreatingNewSupport && (
          <div className="flex flex-col items-center">
            <button
              onClick={() => setIsCreatingNewSupport(true)}
              className="size-44 bg-[#3F3F3F] flex items-center justify-center rounded-[5px]"
            >
              <svg className="fill-white size-14 " viewBox="0 -960 960 960">
                <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
              </svg>
            </button>
            <p className="text-[#3F3F3F] text-lg font-medium mt-2">
              Nouveau support
            </p>
          </div>
        )}
        <div className="flex gap-2">
          {isCreatingNewSupport &&
            supportList.map((support, index) => (
              <Support
                key={index}
                index={index}
                image={support.image}
                name={support.name}
                handleSupportSelection={handleSupportSelection}
                selectedSupport={selectedSupport}
              />
            ))}
        </div>
      </div>

      {isCreatingNewSupport && (
        <div className="flex text-[#3F3F3F] gap-3 mt-5 items-end">
          <label className="flex flex-col font-semibold">
            Numéro du support
            <input
              type="number"
              value={supportNumber}
              className="bg-white px-2 py-2 rounded-md"
              onChange={(e) => setSupportNumber(e.target.value)}
            />
          </label>
          <label className="flex flex-col font-semibold">
            Encart
            <input
              type="text"
              value={libelle}
              className="bg-white px-2 py-2 rounded-md"
              onChange={(e) => setLibelle(e.target.value)}
            />
          </label>

          <label className="flex flex-col font-semibold">
            Prix
            <input
              type="number"
              value={price}
              className="bg-white px-2 py-2 rounded-md"
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          <button
            className="bg-[#3F3F3F] text-white h-10 px-14 rounded text-sm flex items-center gap-1"
            onClick={() => {
              createNewSupport(
                libelle,
                supportNumber,
                price,
                selectedSupport.name,
                selectedSupport.image
              );
              setIsCreatingNewSupport(false);
              setLibelle("");
              setSupportNumber(0);
            }}
          >
            <svg className="fill-white size-[16px] " viewBox="0 -960 960 960">
              <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
            </svg>
            Confirmer
          </button>
        </div>
      )}

      <div className="flex gap-2 mt-5">
        <InvoiceButton
          primary={false}
          value={"Précedent"}
          onClickFunction={previousPageFunction}
        />
        <InvoiceButton value={"Suivant"} onClickFunction={nextPageFunction} />
      </div>
    </div>
  );
};

export default InvoiceSupportChoice;
