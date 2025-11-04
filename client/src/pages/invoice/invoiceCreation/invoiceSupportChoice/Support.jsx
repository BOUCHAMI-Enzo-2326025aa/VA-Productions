const Support = ({
  index,
  image,
  name,
  handleSupportSelection,
  selectedSupport,
}) => {
  return (
    <div
      onClick={() => {
        handleSupportSelection({ name, image });
      }}
      style={{ animationDelay: `${0.1 + index * 0.1}s` }}
      className={
        "invoice-appear-animation " +
        (selectedSupport &&
          selectedSupport.name != name &&
          " cursor-pointer transition-all ")
      }
    >
      <img
        className={
          "w-32 h-32 sm:w-40 sm:h-40 lg:size-44 object-cover rounded " +
          (selectedSupport && selectedSupport.name != name
            ? " opacity-30 transition-all "
            : " !opacity-100 transition-all scale-[1.01] ")
        }
        src={image}
      />
      <p
        className={
          "w-full text-center text-[#3F3F3F] font-semibold text-sm sm:text-base " +
          (selectedSupport && selectedSupport.name === name
            ? " opacity-100 "
            : " opacity-30 ")
        }
      >
        {name}
      </p>
    </div>
  );
};

export default Support;
