import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { PAGE_CONTENT_CONFIG } from "../content/pageContentConfig";

const normalizeKey = (key) => String(key || "").trim().toLowerCase();

const fieldsCache = new Map();

export default function usePageContent(pageKey) {
  const normalizedKey = normalizeKey(pageKey);

  const defaults = useMemo(() => {
    return PAGE_CONTENT_CONFIG?.[normalizedKey]?.defaults || {};
  }, [normalizedKey]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remoteFields, setRemoteFields] = useState(() => {
    return fieldsCache.get(normalizedKey) || null;
  });

  const fetchContent = async () => {
    if (!normalizedKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/page-content/${normalizedKey}`);
      const fields = res?.data?.fields || {};
      fieldsCache.set(normalizedKey, fields);
      setRemoteFields(fields);
    } catch (e) {
      setError(e);
      setRemoteFields(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!normalizedKey) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`/api/page-content/${normalizedKey}`);
        if (!cancelled) {
          const fields = res?.data?.fields || {};
          fieldsCache.set(normalizedKey, fields);
          setRemoteFields(fields);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e);
          setRemoteFields(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    run();

    return () => {
      cancelled = true;
    };
  }, [normalizedKey]);

  const content = useMemo(() => {
    const merged = { ...defaults, ...(remoteFields || {}) };
    // Ensure every value is a string (defensive)
    for (const [k, v] of Object.entries(merged)) {
      if (typeof v !== "string") merged[k] = "";
    }
    return merged;
  }, [remoteFields, defaults]);

  return {
    pageKey: normalizedKey,
    content,
    defaults,
    loading,
    error,
    refresh: fetchContent,
  };
}
