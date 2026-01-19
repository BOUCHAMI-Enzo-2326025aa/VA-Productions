import PageContent from "../model/pageContentModel.js";

const PAGE_KEY_MAX_LEN = 60;
const FIELD_KEY_MAX_LEN = 60;
const FIELD_VALUE_MAX_LEN = 4000;
const MAX_FIELDS_PER_PAGE = 250;

const isValidPageKey = (pageKey) => {
  if (!pageKey) return false;
  if (pageKey.length > PAGE_KEY_MAX_LEN) return false;
  return /^[a-z0-9][a-z0-9._-]*$/.test(pageKey);
};

const isValidFieldKey = (fieldKey) => {
  if (!fieldKey) return false;
  if (fieldKey.length > FIELD_KEY_MAX_LEN) return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(fieldKey);
};

const normalizePageKey = (pageKey) => String(pageKey || "").trim().toLowerCase();

const sanitizeFields = (fields) => {
  const input = fields && typeof fields === "object" ? fields : {};
  const entries = Object.entries(input);
  const limited = entries.slice(0, MAX_FIELDS_PER_PAGE);

  const sanitized = {};
  for (const [fieldKey, raw] of limited) {
    if (!isValidFieldKey(fieldKey)) continue;
    if (typeof raw !== "string") continue;
    sanitized[fieldKey] = raw.trim().slice(0, FIELD_VALUE_MAX_LEN);
  }
  return sanitized;
};

export const getPageContentByKey = async (req, res) => {
  try {
    const pageKey = normalizePageKey(req.params.pageKey);
    if (!isValidPageKey(pageKey)) return res.status(400).json({ error: "Page invalide" });

    const doc = await PageContent.findOne({ pageKey }).lean();
    return res.status(200).json({
      pageKey,
      fields: doc?.fields || {},
      updatedAt: doc?.updatedAt || null,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Erreur serveur" });
  }
};

export const upsertPageContentByKey = async (req, res) => {
  try {
    const pageKey = normalizePageKey(req.params.pageKey);
    if (!isValidPageKey(pageKey)) return res.status(400).json({ error: "Page invalide" });

    const fields = sanitizeFields(req.body?.fields || {});

    const updated = await PageContent.findOneAndUpdate(
      { pageKey },
      {
        $set: {
          pageKey,
          fields,
          updatedBy: req.user?._id,
        },
      },
      { new: true, upsert: true }
    ).lean();

    return res.status(200).json({
      pageKey: updated.pageKey,
      fields: updated.fields,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Erreur serveur" });
  }
};

export const getAllowedPages = async (req, res) => {
  // Returns the list of stored page keys (for UI suggestions)
  try {
    const pages = await PageContent.distinct("pageKey");
    return res.status(200).json({ pages: pages.sort() });
  } catch (error) {
    return res.status(500).json({ error: error?.message || "Erreur serveur" });
  }
};
