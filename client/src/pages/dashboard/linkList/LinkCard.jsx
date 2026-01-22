import React from "react";
import "./linkCard.css";
import EditableText from "../../../components/EditableText";

const LinkCard = ({ img, title, subTitle, link, isEditing = false, titleKey, subTitleKey }) => {
  const Wrapper = isEditing ? "div" : "a";
  const wrapperProps = isEditing ? {} : { href: link };

  return (
    <Wrapper
      {...wrapperProps}
      className="dashboard-link-card overflow-hidden w-full relative h-40 flex flex-col justify-end px-6 pb-3 rounded-[10px] max-xl:h-32 max-lg:h-24 max-lg:px-3 max-[920px]:w-full max-[920px]:min-h-full"
    >
      <img
        className="w-full h-full absolute left-0 top-0 object-cover hover:scale-[1.1] transition-all"
        src={img}
      ></img>
      <EditableText
        storageKey={titleKey}
        defaultValue={title}
        isEditing={isEditing}
        className="uppercase z-10 text-3xl font-black pointer-events-none max-xl:text-2xl max-lg:text-xl"
        inputClassName="relative z-10 bg-white/80 text-[#3F3F3F] text-3xl font-black max-xl:text-2xl max-lg:text-xl"
      />
      <EditableText
        storageKey={subTitleKey}
        defaultValue={subTitle}
        isEditing={isEditing}
        multiline
        rows={2}
        className="opacity-90 z-10 pointer-events-none max-2xl:text-sm max-lg:text-[12px] max-lg:leading-3"
        inputClassName="relative z-10 bg-white/80 text-[#3F3F3F] opacity-90 max-2xl:text-sm max-lg:text-[12px] max-lg:leading-3"
      />
    </Wrapper>
  );
};

export default LinkCard;
