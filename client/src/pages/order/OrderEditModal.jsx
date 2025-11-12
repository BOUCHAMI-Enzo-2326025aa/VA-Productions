import { useMemo, useState } from "react";
import axios from "axios";

const emptySupport = () => ({
  name: "",
  supportName: "",
  supportNumber: 1,
  price: 0,
});

const DEFAULT_SUPPORT_OPTIONS = [
  "WMag",
  "Rouges et Blancs",
  "Ambition Sud",
  "Roses en Provence",
];

const parseDecimal = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  const normalised = String(value).replace(/\s/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalised);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const OrderEditModal = ({ order, onClose, refetchOrders }) => {
  const [form, setForm] = useState({
    compagnyName: order?.compagnyName || "",
    firstAddress: order?.firstAddress || "",
    secondAddress: order?.secondAddress || "",
    postalCode: order?.postalCode || "",
    city: order?.city || "",
    tva: ((order?.tva ?? 0.2) * 100).toString(),
  });
  const [items, setItems] = useState(
    order?.items?.length
      ? order.items.map((item) => ({
          name: item?.name || "",
          supportName: item?.supportName || "",
          supportNumber: Number(item?.supportNumber) || 1,
          price: Number(item?.price) || 0,
        }))
      : [emptySupport()]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const supportOptions = useMemo(() => {
    const options = new Set(DEFAULT_SUPPORT_OPTIONS);
    items.forEach((item) => {
      if (item?.supportName) {
        options.add(item.supportName);
      }
    });
    return Array.from(options);
  }, [items]);

  const totalHT = useMemo(
    () =>
      items.reduce((sum, item) => {
        const price = parseDecimal(item.price, 0);
        return sum + (Number.isFinite(price) ? price : 0);
      }, 0),
    [items]
  );

  const tvaRate = useMemo(() => {
    const parsed = parseDecimal(form.tva, 0);
    const fraction = parsed / 100;
    return fraction >= 0 ? fraction : 0;
  }, [form.tva]);

  const totalTTC = useMemo(
    () => Math.round((totalHT * (1 + tvaRate)) * 100) / 100,
    [totalHT, tvaRate]
  );

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, emptySupport()]);
  };

  const removeItem = (index) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSave = async () => {
    setError("");

    if (!form.compagnyName.trim() || !form.firstAddress.trim() || !form.postalCode.trim() || !form.city.trim()) {
      setError("Veuillez compléter les informations client (entreprise, adresses, code postal et ville).");
      return;
    }

    const parsedTvaPercent = parseDecimal(form.tva, NaN);
    if (!Number.isFinite(parsedTvaPercent) || parsedTvaPercent < 0) {
      setError("Le taux de TVA doit être un nombre positif.");
      return;
    }

    const sanitizedItems = items.map((item) => ({
      name: item.name.trim(),
      supportName: item.supportName.trim(),
      supportNumber: Number.isFinite(Number(item.supportNumber)) ? Number(item.supportNumber) : 0,
      price: parseDecimal(item.price, NaN),
    }));

    if (sanitizedItems.some((item) => !item.name || !item.supportName)) {
      setError("Chaque support doit contenir un encart et un support.");
      return;
    }

    if (sanitizedItems.some((item) => item.supportNumber <= 0)) {
      setError("La quantité doit être supérieure à 0 pour chaque support.");
      return;
    }

    if (sanitizedItems.some((item) => !Number.isFinite(item.price) || item.price < 0)) {
      setError("Le prix de chaque support doit être un nombre positif.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        compagnyName: form.compagnyName.trim(),
        firstAddress: form.firstAddress.trim(),
        secondAddress: form.secondAddress.trim(),
        postalCode: form.postalCode.trim(),
        city: form.city.trim(),
        tva: Math.round((parsedTvaPercent / 100) * 10000) / 10000,
        items: sanitizedItems,
      };

      await axios.put(`${import.meta.env.VITE_API_HOST}/api/order/${order._id}`, payload);
      if (typeof refetchOrders === "function") {
        await refetchOrders();
      }
      onClose();
    } catch (saveError) {
      console.error("Erreur lors de la mise à jour de la commande:", saveError);
      setError(
        saveError?.response?.data?.error || "Impossible de mettre à jour le bon de commande pour le moment."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-xl font-semibold text-[#3F3F3F]">Modifier le bon de commande</h2>
            <p className="text-sm text-gray-500">Ajustez les informations de la commande puis enregistrez vos modifications.</p>
          </div>
          <button
            type="button"
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
            onClick={onClose}
            disabled={isSaving}
          >
            Fermer
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Entreprise *</label>
            <input
              type="text"
              className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              value={form.compagnyName}
              onChange={(e) => handleFieldChange("compagnyName", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Adresse (ligne 1) *</label>
            <input
              type="text"
              className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              value={form.firstAddress}
              onChange={(e) => handleFieldChange("firstAddress", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Adresse (ligne 2)</label>
            <input
              type="text"
              className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              value={form.secondAddress}
              onChange={(e) => handleFieldChange("secondAddress", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Code postal *</label>
            <input
              type="text"
              className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              value={form.postalCode}
              onChange={(e) => handleFieldChange("postalCode", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Ville *</label>
            <input
              type="text"
              className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              value={form.city}
              onChange={(e) => handleFieldChange("city", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">TVA (%) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              value={form.tva}
              onChange={(e) => handleFieldChange("tva", e.target.value)}
            />
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[#3F3F3F]">Supports de la commande</h3>
            <button
              type="button"
              className="text-sm font-medium text-indigo-500 hover:text-indigo-600"
              onClick={addItem}
            >
              + Ajouter un support
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {items.map((item, index) => (
              <div key={index} className="grid gap-3 rounded-lg border border-gray-200 p-4 md:grid-cols-5">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-medium text-gray-500">Encart *</label>
                  <input
                    type="text"
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, "name", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-medium text-gray-500">Support *</label>
                  <select
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    value={item.supportName}
                    onChange={(e) => handleItemChange(index, "supportName", e.target.value)}
                  >
                    <option value="" disabled>
                      Sélectionnez un support
                    </option>
                    {supportOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Qté *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    value={item.supportNumber}
                    onChange={(e) => handleItemChange(index, "supportNumber", e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-medium text-gray-500">Montant (€) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, "price", e.target.value)}
                  />
                </div>
                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    className="text-xs font-medium text-red-500 hover:text-red-600"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col items-end gap-1 text-sm text-gray-600">
          <div>Total HT : {totalHT.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</div>
          <div>TVA ({Math.round(tvaRate * 10000) / 100} %) : {(totalHT * tvaRate).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</div>
          <div className="text-base font-semibold text-[#3F3F3F]">
            Total TTC : {totalTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t pt-4">
          <button
            type="button"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            onClick={onClose}
            disabled={isSaving}
          >
            Annuler
          </button>
          <button
            type="button"
            className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-300"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderEditModal;
