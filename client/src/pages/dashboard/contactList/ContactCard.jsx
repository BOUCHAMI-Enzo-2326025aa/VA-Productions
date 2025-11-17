import { getDayMonth } from "../../../utils/formatDate";

const ContactCard = ({ name, phoneNumber, lastSeen, isLast, description }) => {
  return (
    <div
      className={
        "flex w-full text-main-color gap-3 items-center pb-3 " +
        (!isLast && "border-b-black border-opacity-5 border-b-2")
      }
    >
      <div className="bg-secondary-color px-2 py-2 rounded-[5px] max-[850px]:px-1 max-[850px]:py-1">
        <svg
          className="size-10 fill-white max-[850px]:size-6"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 -960 960 960"
        >
          <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z" />
        </svg>
      </div>
      <div>
        <p className="font-medium leading-4 max-[850px]:text-sm ">{name}</p>
        <p className="opacity-70 max-[850px]:text-xs leading-5 mt-1">
          {description}
        </p>
      </div>
      <div className="self-end ml-auto opacity-50 max-[850px]:text-xs">
        {getDayMonth(lastSeen)}
      </div>
    </div>
  );
};

export default ContactCard;
