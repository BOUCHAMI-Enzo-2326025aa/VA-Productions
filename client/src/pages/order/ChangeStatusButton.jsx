
import EditableText from "../../components/EditableText";

const ChangeStatusButton = ({
  statusToShow,
  setStatusToShow,
  isEditing = false,
  pendingLabel = "En attentes",
  approvedLabel = "Validés",
  cancelLabel = "Annulés",
  onPendingLabelChange,
  onApprovedLabelChange,
  onCancelLabelChange,
}) => {
  return (
    <div className="bg-black bg-opacity-5  flex justify-around w-[400px] py-2 font-semibold rounded-xl mt-5 relative">
      <span
        className={`bg-white w-[33%] h-[95%] absolute -translate-y-[50%] top-[50%] rounded-xl transition-all z-10 ${
          statusToShow === "pending" ? "left-[0%] " : ""
        } ${
          statusToShow === "approved" ? "left-[50%] -translate-x-[50%] " : ""
        } ${
          statusToShow === "cancel" ? "left-[100%] -translate-x-[100%]" : ""
        }`}
      />

      <a
        className="z-20 cursor-pointer w-24 text-center"
        onClick={() => setStatusToShow("pending")}
      >
        <EditableText
          storageKey="orders:status:pending"
          defaultValue={pendingLabel}
          isEditing={isEditing}
          onValueChange={onPendingLabelChange}
          className=""
          inputClassName="text-sm font-semibold text-center"
          as="span"
        />
      </a>
      <a
        className="z-20 cursor-pointer w-24 text-center"
        onClick={() => setStatusToShow("approved")}
      >
        <EditableText
          storageKey="orders:status:approved"
          defaultValue={approvedLabel}
          isEditing={isEditing}
          onValueChange={onApprovedLabelChange}
          className=""
          inputClassName="text-sm font-semibold text-center"
          as="span"
        />
      </a>
      <a
        className="z-20 cursor-pointer w-24 text-center"
        onClick={() => setStatusToShow("cancel")}
      >
        <EditableText
          storageKey="orders:status:cancel"
          defaultValue={cancelLabel}
          isEditing={isEditing}
          onValueChange={onCancelLabelChange}
          className=""
          inputClassName="text-sm font-semibold text-center"
          as="span"
        />
      </a>
    </div>
  );
};

export default ChangeStatusButton;
