import { useState } from "react";
import InvoiceButton from "../component/InvoiceButton";
import FilterInput from "./FilterInput";
import DatePickerWithRange from "./utils/DatePickerWithRange";
import MultiSelectComponent from "./utils/MultiSelectComponent";
import { MultiSelect } from "@mantine/core";
import EditableText from "../../../components/EditableText";

const readStoredValue = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw;
  } catch {
    return fallback;
  }
};

const FilterModal = ({
  filter,
  setFilter,
  filterInvoiceAction,
  deleteFilter,
  clientList,
  magazineList,
  isEditing = false,
}) => {
  const [filtersTitle, setFiltersTitle] = useState(() =>
    readStoredValue("invoices:filters:title", "FILTRES")
  );
  const [supportTitle, setSupportTitle] = useState(() =>
    readStoredValue("invoices:filters:support", "Type de support")
  );
  const [clientTitle, setClientTitle] = useState(() =>
    readStoredValue("invoices:filters:client", "Client")
  );
  const [dateTitle, setDateTitle] = useState(() =>
    readStoredValue("invoices:filters:date", "Date")
  );
  const [statusTitle, setStatusTitle] = useState(() =>
    readStoredValue("invoices:filters:status", "Status")
  );
  const [paidLabel, setPaidLabel] = useState(() =>
    readStoredValue("invoices:filters:paid", "Payé")
  );
  const [unpaidLabel, setUnpaidLabel] = useState(() =>
    readStoredValue("invoices:filters:unpaid", "Non payé")
  );
  const [overdueLabel, setOverdueLabel] = useState(() =>
    readStoredValue("invoices:filters:overdue", "Impayé")
  );
  const [clientPlaceholder, setClientPlaceholder] = useState(() =>
    readStoredValue("invoices:filters:client-placeholder", "Choisir des clients")
  );
  const [clearLabel, setClearLabel] = useState(() =>
    readStoredValue("invoices:filters:clear", "Supprimer les filtres")
  );
  const [searchLabel, setSearchLabel] = useState(() =>
    readStoredValue("invoices:filters:search", "Rechercher")
  );
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
      <EditableText
        storageKey="invoices:filters:title"
        defaultValue={filtersTitle}
        isEditing={isEditing}
        className="text-[#3F3F3F]"
        inputClassName="text-[#3F3F3F]"
        onValueChange={setFiltersTitle}
      />

      <div className="mt-6 flex w-full gap-4">
        <FilterInput
          title={
            <EditableText
              storageKey="invoices:filters:support"
              defaultValue={supportTitle}
              isEditing={isEditing}
              inputClassName="text-sm"
              onValueChange={setSupportTitle}
              as="span"
            />
          }
        >
          <MultiSelectComponent filter={filter} setFilter={setFilter} magazineList={magazineList} />
        </FilterInput>
        <FilterInput
          title={
            <EditableText
              storageKey="invoices:filters:client"
              defaultValue={clientTitle}
              isEditing={isEditing}
              inputClassName="text-sm"
              onValueChange={setClientTitle}
              as="span"
            />
          }
        >
          {isEditing ? (
            <EditableText
              storageKey="invoices:filters:client-placeholder"
              defaultValue={clientPlaceholder}
              isEditing={isEditing}
              inputClassName="text-sm"
              onValueChange={setClientPlaceholder}
              as="span"
            />
          ) : null}
          <MultiSelect
            placeholder={clientPlaceholder}
            data={clientList}
            value={filter.compagnies}
            comboboxProps={{
              transitionProps: { transition: "pop", duration: 200 },
            }}
            onChange={(value) => setFilter("compagnies", value)}
          />
        </FilterInput>
        <FilterInput
          title={
            <EditableText
              storageKey="invoices:filters:date"
              defaultValue={dateTitle}
              isEditing={isEditing}
              inputClassName="text-sm"
              onValueChange={setDateTitle}
              as="span"
            />
          }
          className={"min-w-[300px]"}
        >
          <DatePickerWithRange setFilter={setFilter} filter={filter} />
        </FilterInput>
      </div>
      <FilterInput
        title={
          <EditableText
            storageKey="invoices:filters:status"
            defaultValue={statusTitle}
            isEditing={isEditing}
            inputClassName="text-sm"
            onValueChange={setStatusTitle}
            as="span"
          />
        }
        className="mt-6 w-fit"
      >
        <div className="flex items-center justify-between w-[100px]">
          <EditableText
            storageKey="invoices:filters:paid"
            defaultValue={paidLabel}
            isEditing={isEditing}
            inputClassName="text-sm"
            onValueChange={setPaidLabel}
            as="span"
          />
          <input
            type="checkbox"
            onChange={(e) => {
              handleCheckboxChange("paid", e);
            }}
            checked={filter.status.includes("paid")}
          />
        </div>
        <div className="flex items-center justify-between w-[100px]">
          <EditableText
            storageKey="invoices:filters:unpaid"
            defaultValue={unpaidLabel}
            isEditing={isEditing}
            inputClassName="text-sm"
            onValueChange={setUnpaidLabel}
            as="span"
          />
          <input
            type="checkbox"
            onChange={(e) => handleCheckboxChange("unpaid", e)}
            checked={filter.status.includes("unpaid")}
          />
        </div>
         <div className="flex items-center justify-between w-[100px]">
          <EditableText
            storageKey="invoices:filters:overdue"
            defaultValue={overdueLabel}
            isEditing={isEditing}
            inputClassName="text-sm"
            onValueChange={setOverdueLabel}
            as="span"
          />
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
        {isEditing ? (
          <>
            <EditableText
              storageKey="invoices:filters:clear"
              defaultValue={clearLabel}
              isEditing={isEditing}
              inputBaseClassName="border-[#3F3F3F] text-[#3F3F3F] rounded-sm border-[2px] w-48 h-10 px-3 font-bold font-inter"
              inputClassName="text-[#3F3F3F] font-bold text-center text-sm"
              onValueChange={setClearLabel}
            />
            <EditableText
              storageKey="invoices:filters:search"
              defaultValue={searchLabel}
              isEditing={isEditing}
              inputBaseClassName="bg-[#3F3F3F] text-white rounded-sm w-48 h-10 px-3 font-medium font-inter"
              inputClassName="text-white font-medium text-center text-sm"
              onValueChange={setSearchLabel}
            />
          </>
        ) : (
          <>
            <InvoiceButton
              primary={false}
              onClickFunction={deleteFilter}
              value={clearLabel}
              className={"h-10 !py-0 text-sm w-48"}
            />
            <InvoiceButton
              value={searchLabel}
              className={"h-10 !py-0 text-sm w-48"}
              onClickFunction={filterInvoiceAction}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default FilterModal;
