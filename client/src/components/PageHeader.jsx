import { useEffect, useMemo, useState } from "react";

const readStoredHeader = (key) => {
  if (!key) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const PageHeader = ({
  title,
  description,
  storageKey,
  actions,
  className,
  titleClassName,
  descriptionClassName,
  editMode,
  onEditModeChange,
  editToggleLabel,
  titleSuffix,
  canEdit = true,
}) => {
  const headerKey = useMemo(
    () => storageKey || `page-header:${title || "page"}`,
    [storageKey, title]
  );
  const [internalEditing, setInternalEditing] = useState(false);
  const resolvedEditing = typeof editMode === "boolean" ? editMode : internalEditing;
  const isEditing = canEdit ? resolvedEditing : false;
  const setEditing = (nextValue) => {
    if (!canEdit) return;
    if (onEditModeChange) {
      onEditModeChange(nextValue);
      return;
    }
    setInternalEditing(nextValue);
  };

  useEffect(() => {
    try {
      if (!canEdit) {
        localStorage.setItem("ui:edit-mode", "false");
        window.dispatchEvent(
          new CustomEvent("ui-edit-mode-change", {
            detail: { isEditing: false },
          })
        );
        return;
      }

      localStorage.setItem("ui:edit-mode", isEditing ? "true" : "false");
      window.dispatchEvent(
        new CustomEvent("ui-edit-mode-change", {
          detail: { isEditing },
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [isEditing, canEdit]);
  const [currentTitle, setCurrentTitle] = useState(title || "");
  const [currentDescription, setCurrentDescription] = useState(description || "");
  const [draftTitle, setDraftTitle] = useState(title || "");
  const [draftDescription, setDraftDescription] = useState(description || "");

  useEffect(() => {
    const normalizeTitle = (value) => {
      if (!value) return "";
      if (!titleSuffix) return value;
      const suffix = String(titleSuffix);
      if (suffix && value.endsWith(suffix)) {
        return value.slice(0, -suffix.length).trimEnd();
      }
      return value;
    };

    const stored = readStoredHeader(headerKey);
    if (stored) {
      const nextTitle = normalizeTitle(stored.title ?? title ?? "");
      const nextDescription = stored.description ?? description ?? "";
      setCurrentTitle(nextTitle);
      setCurrentDescription(nextDescription);
      setDraftTitle(nextTitle);
      setDraftDescription(nextDescription);
      return;
    }

    setCurrentTitle(normalizeTitle(title || ""));
    setCurrentDescription(description || "");
    setDraftTitle(normalizeTitle(title || ""));
    setDraftDescription(description || "");
  }, [headerKey, title, description, titleSuffix]);

  const handleSave = () => {
    const nextTitle = (draftTitle || "").trim() || title || "";
    const nextDescription = (draftDescription || "").trim();
    const payload = { title: nextTitle, description: nextDescription };

    try {
      localStorage.setItem(headerKey, JSON.stringify(payload));
    } catch {
      // Ignore storage errors (quota, private mode, etc.)
    }

    setCurrentTitle(nextTitle);
    setCurrentDescription(nextDescription);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraftTitle(currentTitle || title || "");
    setDraftDescription(currentDescription || description || "");
    setEditing(false);
  };

  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${
        className || ""
      }`}
    >
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[#3F3F3F] font-semibold focus:outline-none focus:ring-2 focus:ring-[#3F3F3F] ${
                titleClassName || ""
              }`}
              placeholder="Titre de la page"
            />
              {titleSuffix ? (
                <span className="text-[#3F3F3F] font-semibold">
                  {titleSuffix}
                </span>
              ) : null}
            </div>
            <textarea
              value={draftDescription}
              onChange={(event) => setDraftDescription(event.target.value)}
              rows={2}
              className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[#3F3F3F] focus:outline-none focus:ring-2 focus:ring-[#3F3F3F] ${
                descriptionClassName || ""
              }`}
              placeholder="Description de la page"
            />
          </div>
        ) : (
          <>
            <p
              className={`font-bold text-lg md:text-xl leading-3 text-[#3F3F3F] ${
                titleClassName || ""
              }`}
            >
              {currentTitle}
              {titleSuffix}
            </p>
            {currentDescription ? (
              <p
                className={`opacity-80 mt-2 text-sm md:text-base text-[#3F3F3F] ${
                  descriptionClassName || ""
                }`}
              >
                {currentDescription}
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-2 justify-start sm:justify-end">
        {actions}
        {canEdit ? (
          isEditing ? (
          <>
            <button
              type="button"
              onClick={handleSave}
              className="bg-[#3F3F3F] text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-80 transition"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="border border-[#3F3F3F] text-[#3F3F3F] px-4 py-2 rounded-lg font-semibold hover:bg-black hover:bg-opacity-5 transition"
            >
              Annuler
            </button>
          </>
          ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="border border-[#3F3F3F] text-[#3F3F3F] px-4 py-2 rounded-lg font-semibold hover:bg-black hover:bg-opacity-5 transition"
          >
            {editToggleLabel || "Mode édition"}
          </button>
          )
        ) : null}
      </div>
    </div>
  );
};

export default PageHeader;
