import PageContent from "../model/pageContentModel.js";

export const getPageContent = async (req, res) => {
  try {
    const pageKey = decodeURIComponent(req.params.pageKey || "").trim();
    if (!pageKey) {
      return res.status(400).json({ error: "pageKey manquant" });
    }

    const doc = await PageContent.findOne({ pageKey }).lean();
    if (!doc) {
      return res.status(200).json({ pageKey, fields: {} });
    }

    return res.status(200).json({ pageKey: doc.pageKey, fields: doc.fields || {} });
  } catch (error) {
    return res.status(500).json({ error: "Erreur récupération contenu" });
  }
};

export const upsertPageContent = async (req, res) => {
  try {
    const pageKey = decodeURIComponent(req.params.pageKey || "").trim();
    if (!pageKey) {
      return res.status(400).json({ error: "pageKey manquant" });
    }

    const incomingFields = req.body?.fields;
    if (!incomingFields || typeof incomingFields !== "object") {
      return res.status(400).json({ error: "fields invalide" });
    }

    const existing = await PageContent.findOne({ pageKey });
    const mergedFields = {
      ...(existing?.fields || {}),
      ...incomingFields,
    };

    const doc = await PageContent.findOneAndUpdate(
      { pageKey },
      {
        $set: { fields: mergedFields, updatedBy: req.user?._id || req.user?.id || null },
      },
      { new: true, upsert: true }
    ).lean();

    return res.status(200).json({ pageKey: doc.pageKey, fields: doc.fields || {} });
  } catch (error) {
    return res.status(500).json({ error: "Erreur mise à jour contenu" });
  }
};
