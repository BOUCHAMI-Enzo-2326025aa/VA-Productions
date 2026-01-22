import { useEffect, useRef, useState } from "react";
import { getPageContent, updatePageContent } from "../utils/pageContentApi";

const EditableText = ({
  storageKey,
  defaultValue = "",
  isEditing = false,
  multiline = false,
  rows = 2,
  className,
  inputClassName,
  inputBaseClassName,
  placeholder,
  as: Component = "p",
  onValueChange,
}) => {
  const [value, setValue] = useState(defaultValue || "");
  const saveTimeoutRef = useRef(null);
  const lastSavedRef = useRef(defaultValue || "");

  useEffect(() => {
    let isActive = true;

    const loadValue = async () => {
      if (!storageKey) {
        setValue(defaultValue || "");
        lastSavedRef.current = defaultValue || "";
        return;
      }

      try {
        const fields = await getPageContent(storageKey);
        if (!isActive) return;
        const nextValue = fields?.value ?? defaultValue ?? "";
        setValue(nextValue);
        lastSavedRef.current = nextValue;
      } catch {
        if (!isActive) return;
        setValue(defaultValue || "");
        lastSavedRef.current = defaultValue || "";
      }
    };

    loadValue();

    return () => {
      isActive = false;
    };
  }, [storageKey, defaultValue]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const scheduleSave = (nextValue) => {
    if (!storageKey) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      if (nextValue === lastSavedRef.current) return;
      try {
        await updatePageContent(storageKey, { value: nextValue ?? "" });
        lastSavedRef.current = nextValue ?? "";
      } catch {
        // Ignore save errors
      }
    }, 450);
  };

  const handleChange = (nextValue) => {
    setValue(nextValue);
    scheduleSave(nextValue);
    if (onValueChange) {
      onValueChange(nextValue);
    }
  };

  if (isEditing) {
    const baseClassName =
      inputBaseClassName ||
      "w-full rounded-md border-2 border-dashed border-[#3F3F3F] bg-white/80 px-2 py-1 text-[#3F3F3F] focus:outline-none focus:ring-2 focus:ring-[#3F3F3F]";
    if (multiline) {
      return (
        <textarea
          value={value}
          rows={rows}
          onChange={(event) => handleChange(event.target.value)}
          placeholder={placeholder}
          className={`${baseClassName} ${inputClassName || ""}`}
        />
      );
    }

    return (
      <input
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        className={`${baseClassName} ${inputClassName || ""}`}
      />
    );
  }

  return <Component className={className}>{value}</Component>;
};

export default EditableText;
