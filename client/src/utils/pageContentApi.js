import axios from "axios";

export const getPageContent = async (pageKey) => {
  if (!pageKey) return null;
  const safeKey = encodeURIComponent(pageKey);
  const response = await axios.get(`/api/page-content/${safeKey}`);
  return response?.data?.fields ?? null;
};

export const updatePageContent = async (pageKey, fields) => {
  if (!pageKey) return null;
  const safeKey = encodeURIComponent(pageKey);
  const response = await axios.put(`/api/page-content/${safeKey}`, { fields });
  return response?.data?.fields ?? null;
};
