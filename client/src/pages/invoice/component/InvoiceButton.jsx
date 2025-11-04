const InvoiceButton = ({
  value,
  className,
  onClickFunction,
  primary = true,
}) => {
  return (
    <>
      {primary ? (
        <button
          onClick={onClickFunction}
          className={
            className +
            " bg-[#3F3F3F] w-full sm:w-[275px] py-3 rounded-sm font-medium font-inter text-white "
          }
        >
          {value}
        </button>
      ) : (
        <button
          onClick={onClickFunction}
          className={
            className +
            " border-[#3F3F3F] text-[#3F3F3F] rounded-sm border-[2px] w-full sm:w-[275px] py-3 font-bold font-inter box-border "
          }
        >
          {value}
        </button>
      )}
    </>
  );
};

export default InvoiceButton;
