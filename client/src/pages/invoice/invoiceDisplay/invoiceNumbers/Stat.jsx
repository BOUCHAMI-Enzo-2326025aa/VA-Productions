import Skeleton from "../../../../components/Skeleton.jsx";
import formatPrice from "../../../../utils/formatPrice.js";
import EditableText from "../../../../components/EditableText";

const Stat = ({
  icon,
  title,
  value,
  subtitle,
  subtitleValue,
  subtitleLabel,
  loading,
  bgColor = "bg-[#1B1B14]",
  isEditing = false,
  titleKey,
  subtitleLabelKey,
  onTitleChange,
  onSubtitleLabelChange,
}) => {
  return (
    <div className={`${bgColor} w-[320px] px-6 py-4 rounded-lg`}>
      <div className="flex items-center gap-2">
        <EditableText
          storageKey={titleKey}
          defaultValue={title}
          isEditing={isEditing}
          className="text-md text-white opacity-80"
          inputClassName="text-md text-white"
          onValueChange={onTitleChange}
        />
      </div>
      <Skeleton
        visible={loading}
        width={"25%"}
        height={"20px"}
        color={"white"}
        opacity={"10%"}
      >
        <p className="font-bold text-[27px] text-white mt-2 leading-8 ">
          {formatPrice(value)}
        </p>
      </Skeleton>
      <Skeleton
        visible={loading}
        width={"50%"}
        height={"20px"}
        color={"white"}
        opacity={"10%"}
      >
        <p className="text-sm opacity-70 font-light text-white">
          {subtitleValue !== undefined ? (
            <>
              <span>{subtitleValue} </span>
              <EditableText
                storageKey={subtitleLabelKey}
                defaultValue={subtitleLabel || ""}
                isEditing={isEditing}
                className="text-sm opacity-70 font-light text-white"
                inputClassName="text-sm text-white"
                onValueChange={onSubtitleLabelChange}
                as="span"
              />
            </>
          ) : (
            <EditableText
              storageKey={subtitleLabelKey}
              defaultValue={subtitle || ""}
              isEditing={isEditing}
              className="text-sm opacity-70 font-light text-white"
              inputClassName="text-sm text-white"
              onValueChange={onSubtitleLabelChange}
            />
          )}
        </p>
      </Skeleton>
    </div>
  );
};

export default Stat;
