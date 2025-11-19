import React from "react";

const CardFacture = ({ fileName, supportList, price, date }) => {
  const totalHT = supportList.reduce(
    (total, support) => total + support.price,
    0
  );
  const totalTTC = (totalHT * 1.2).toFixed(2);
  const supportName = supportList.map((support) => support.name).join(", ");
  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
  return (
    <div className="flex flex-col py-2">
      <p className="text-[#3F3F3F] text-sm font-semibold">{formattedDate}</p>
      <div className="flex flex-col items-start sm:flex-row sm:justify-between sm:items-center">
        <div className="flex p-[10px] border border-l-[#3F3F3F] border-opacity-60 border-t-0 border-r-0 border-b-0 ml-2 gap-2 items-center">
          <div className="bg-[#FF6969] px-2 py-2 rounded-[5px] w-fit">
            <svg
              className="size-10 fill-white max-[850px]:size-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 -960 960 960"
            >
              <path d="M440-240h80v-40h40q17 0 28.5-11.5T600-320v-120q0-17-11.5-28.5T560-480H440v-40h160v-80h-80v-40h-80v40h-40q-17 0-28.5 11.5T360-560v120q0 17 11.5 28.5T400-400h120v40H360v80h80v40ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Z" />{" "}
            </svg>
          </div>
          <div className="flex flex-col">
            <p className="text-[#3F3F3F] text-[16px]">{fileName}</p>
            <p className="text-[#3F3F3F] text-[14px] text-opacity-80">
              {supportName}
            </p>
          </div>
        </div>
        <p className="text-[#3F3F3F] text-[16px] mt-2 sm:mt-0 ml-2 sm:ml-0">{totalTTC + "€"} </p>
      </div>
    </div>
  );
};

export default CardFacture;