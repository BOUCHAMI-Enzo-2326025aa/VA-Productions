import { useState } from "react";
import InvoiceButton from "../component/InvoiceButton";
import FilterInput from "./FilterInput";
import DatePickerWithRange from "./utils/DatePickerWithRange";
import MultiSelectComponent from "./utils/MultiSelectComponent";
import { MultiSelect } from "@mantine/core";

const FilterModal = ({
  filter,
  setFilter,
  filterInvoiceAction,
  deleteFilter,
  clientList,
}) => {
  const handleCheckboxChange = (status, e) => {
    const newStatus = e.target.checked
      ? [...filter.status, status]
      : filter.status.filter((s) => s !== status);

    setFilter("status", newStatus);
  };

  return (
    <div
      style={{ animationDelay: "0.1s" }}
      className="bg-white min-w-[1000px] opacity-0 rounded appear-animation z-10 absolute left-0 top-0 px-6 py-4 font-semibold uppercase"
    >
      <p className="text-[#3F3F3F]">FILTRES</p>

      <div className="mt-6 flex w-full gap-4">
        <FilterInput title="Type de support">
          <MultiSelectComponent filter={filter} setFilter={setFilter} />
        </FilterInput>
        <FilterInput title="Client">
          <MultiSelect
            placeholder="Choisir des clients"
            data={clientList}
            value={filter.compagnies}
            comboboxProps={{
              transitionProps: { transition: "pop", duration: 200 },
            }}
            onChange={(value) => setFilter("compagnies", value)}
          />
        </FilterInput>
        <FilterInput title="Date" className={"min-w-[300px]"}>
          <DatePickerWithRange setFilter={setFilter} filter={filter} />
        </FilterInput>
      </div>
      <FilterInput title="Status" className="mt-6 w-fit">
        <div className="flex items-center justify-between w-[100px]">
          Payé
          <input
            type="checkbox"
            onChange={(e) => {
              handleCheckboxChange("paid", e);
            }}
            checked={filter.status.includes("paid")}
          />
        </div>
        <div className="flex items-center justify-between w-[100px]">
          Non payé
          <input
            type="checkbox"
            onChange={(e) => handleCheckboxChange("unpaid", e)}
            checked={filter.status.includes("unpaid")}
          />
        </div>
         <div className="flex items-center justify-between w-[100px]">
          Impayé
          <input
            type="checkbox"
            onChange={(e) => handleCheckboxChange("overdue", e)} 
            checked={filter.status.includes("overdue")}
          />
        </div>
        {/*
        <div className="flex items-center justify-between w-[100px]">
          En cours
          <input
            type="checkbox"
            onChange={(e) => handleCheckboxChange("progress", e)}
            checked={filter.status.includes("progress")}
          />
        </div>
        */}

      </FilterInput>
      <div className="mt-auto flex gap-1 justify-end pt-10">
        <InvoiceButton
          primary={false}
          onClickFunction={deleteFilter}
          value={"Supprimer les filtres"}
          className={"h-10 !py-0 text-sm w-48"}
        />
        <InvoiceButton
          value={"Rechercher"}
          className={"h-10 !py-0 text-sm w-48"}
          onClickFunction={filterInvoiceAction}
        />
      </div>
    </div>
  );
};

export default FilterModal;
