const SupportRevenu = ({ supportName, image, invoices }) => {
  const invoicesFiltered = invoices.filter((invoice) =>
    invoice.supportList.some(
      (support) =>
        support.supportName.toLowerCase() === supportName.toLowerCase()
    )
  );
  const total = invoicesFiltered.reduce(
    (acc, curr) => acc + curr.totalPrice,
    0
  );

  if (invoicesFiltered.length === 0) return <></>;

  return (
    <div className="rounded border-2 w-full sm:w-60 md:w-72 p-2">
      <img
        className="w-full h-36 object-cover rounded "
        src={image}
        alt={supportName}
      />
      <div className="mt-2 ml-2">
        <p className="font-bold text-lg">{supportName}</p>
        <p className="leading-4 opacity-80">
          {invoicesFiltered.length} Commande
          {invoicesFiltered.length > 1 && "s"}
        </p>
        <p className="font-bold text-xl mt-5 ">{total}€</p>
      </div>
    </div>
  );
};

export default SupportRevenu;