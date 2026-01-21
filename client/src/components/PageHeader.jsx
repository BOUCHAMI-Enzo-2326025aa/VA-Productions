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
}) => {
  const headerKey = useMemo(
    () => storageKey || `page-header:${title || "page"}`,
    [storageKey, title]
  );
  const [isEditing, setIsEditing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(title || "");
  const [currentDescription, setCurrentDescription] = useState(description || "");
  const [draftTitle, setDraftTitle] = useState(title || "");
  const [draftDescription, setDraftDescription] = useState(description || "");

  useEffect(() => {
    const stored = readStoredHeader(headerKey);
    if (stored) {
      const nextTitle = stored.title ?? title ?? "";
      const nextDescription = stored.description ?? description ?? "";
      setCurrentTitle(nextTitle);
      setCurrentDescription(nextDescription);
      setDraftTitle(nextTitle);
      setDraftDescription(nextDescription);
      return;
    }

    setCurrentTitle(title || "");
    setCurrentDescription(description || "");
    setDraftTitle(title || "");
    setDraftDescription(description || "");
  }, [headerKey, title, description]);

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
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraftTitle(currentTitle || title || "");
    setDraftDescription(currentDescription || description || "");
    setIsEditing(false);
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
            <input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[#3F3F3F] font-semibold focus:outline-none focus:ring-2 focus:ring-[#3F3F3F] ${
                titleClassName || ""
              }`}
              placeholder="Titre de la page"
            />
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
        {isEditing ? (
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
            onClick={() => setIsEditing(true)}
            className="border border-[#3F3F3F] text-[#3F3F3F] px-4 py-2 rounded-lg font-semibold hover:bg-black hover:bg-opacity-5 transition"
          >
            Mode édition
          </button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
