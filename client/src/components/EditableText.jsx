import { useEffect, useState } from "react";

const readStoredValue = (key) => {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : raw;
  } catch {
    return null;
  }
};

const writeStoredValue = (key, value) => {
  if (!key) return;
  try {
    localStorage.setItem(key, value ?? "");
  } catch {
    // Ignore storage errors
  }
};

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

  useEffect(() => {
    const stored = readStoredValue(storageKey);
    if (stored !== null) {
      setValue(stored);
      return;
    }
    setValue(defaultValue || "");
  }, [storageKey, defaultValue]);

  const handleChange = (nextValue) => {
    setValue(nextValue);
    writeStoredValue(storageKey, nextValue);
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
