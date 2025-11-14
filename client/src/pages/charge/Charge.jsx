import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";

const emptyRow = () => ({
  compte: "",
  nom: "",
  montantPrecedent: "0",
  montantPrevu: "0",
  isDirty: true,
  isNew: true,
});

const parseAmount = (value) => {
  const num = Number.parseInt(value, 10);
  return Number.isFinite(num) ? num : 0;
};

const mapCharge = (charge) => ({
  _id: charge._id,
  compte: charge.compte ?? "",
  nom: charge.nom ?? "",
  montantPrecedent:
    typeof charge.montantPrecedent === "number"
      ? String(charge.montantPrecedent)
      : charge.montantPrecedent ?? "0",
  montantPrevu:
    typeof charge.montantPrevu === "number"
      ? String(charge.montantPrevu)
      : charge.montantPrevu ?? "0",
  isDirty: false,
  isNew: false,
});

const Charge = () => {
  const { isAdmin } = useAuth();
  const [charges, setCharges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingRowId, setSavingRowId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    if (message) {
      setTimeout(() => setFeedback({ type: "", message: "" }), 3000);
    }
  };

  const fetchCharges = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_HOST}/api/charge`
      );
      const mapped = Array.isArray(data?.charges)
        ? data.charges.map(mapCharge)
        : [];
      setCharges(mapped);
    } catch (error) {
      console.error("Erreur lors du chargement des charges:", error);
      showFeedback(
        "error",
        error.response?.data?.error || "Impossible de charger les charges."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchCharges();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const updateRowAtIndex = (index, updates) => {
    setCharges((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              ...updates,
              isDirty: true,
            }
          : row
      )
    );
  };

  const handleCompteChange = (index, value) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    updateRowAtIndex(index, { compte: digits });
  };

  const handleTextChange = (index, value) => {
    updateRowAtIndex(index, { nom: value });
  };

  const handleNumberChange = (index, field, value) => {
    const cleaned = value.replace(/[^0-9-]/g, "");
    updateRowAtIndex(index, { [field]: cleaned });
  };

  const handleAddRow = () => {
    setCharges((prev) => [...prev, emptyRow()]);
  };

  const validateRow = (row) => {
    if (!/^[0-9]{6}$/.test(row.compte)) {
      return "Le compte doit contenir exactement 6 chiffres.";
    }

    if (!row.nom.trim()) {
      return "Le nom du compte est obligatoire.";
    }

    return null;
  };

  const handleSaveRow = async (index) => {
    const row = charges[index];
    const errorMessage = validateRow(row);
    if (errorMessage) {
      showFeedback("error", errorMessage);
      return;
    }

    const payload = {
      compte: row.compte,
      nom: row.nom.trim(),
      montantPrecedent: parseAmount(row.montantPrecedent),
      montantPrevu: parseAmount(row.montantPrevu),
    };

    const tempId = row._id || `temp-${index}`;
    setSavingRowId(tempId);

    try {
      if (row.isNew || !row._id) {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_HOST}/api/charge`,
          payload
        );
        const savedCharge = mapCharge(data.charge);
        setCharges((prev) =>
          prev.map((item, i) => (i === index ? savedCharge : item))
        );
      } else {
        const { data } = await axios.put(
          `${import.meta.env.VITE_API_HOST}/api/charge/${row._id}`,
          payload
        );
        const savedCharge = mapCharge(data.charge);
        setCharges((prev) =>
          prev.map((item, i) => (i === index ? savedCharge : item))
        );
      }
      showFeedback("success", "Charge enregistrée avec succès.");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la charge:", error);
      showFeedback(
        "error",
        error.response?.data?.error || "Impossible d'enregistrer la charge."
      );
    } finally {
      setSavingRowId(null);
    }
  };

  const handleRemoveRow = async (index) => {
    const row = charges[index];

    if (!row._id) {
      setCharges((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    setSavingRowId(row._id);
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_HOST}/api/charge/${row._id}`
      );
      setCharges((prev) => prev.filter((_, i) => i !== index));
      showFeedback("success", "Charge supprimée avec succès.");
    } catch (error) {
      console.error("Erreur lors de la suppression de la charge:", error);
      showFeedback(
        "error",
        error.response?.data?.error || "Impossible de supprimer la charge."
      );
    } finally {
      setSavingRowId(null);
    }
  };

  const totalPrecedent = useMemo(
    () => charges.reduce((sum, row) => sum + parseAmount(row.montantPrecedent), 0),
    [charges]
  );

  const totalPrevu = useMemo(
    () => charges.reduce((sum, row) => sum + parseAmount(row.montantPrevu), 0),
    [charges]
  );

  if (!isAdmin) {
    return (
      <div className="text-[#3F3F3F] mt-10">
        Accès refusé. Vous devez être administrateur pour voir cette page.
      </div>
    );
  }

  return (
    <div className="text-[#3F3F3F] pb-12">
      {feedback.message && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm font-semibold text-white ${
            feedback.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="flex justify-between items-center mt-10">
        <div>
          <p className="font-bold text-lg leading-3">Saisie des charges</p>
          <p className="opacity-80 mt-2">
            Renseignez et ajustez les montants prévus pour chaque compte.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddRow}
          className="bg-[#3F3F3F] text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-80 transition"
        >
          Ajouter une ligne
        </button>
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-white shadow-sm">
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-gray-500">
                Compte (6 chiffres)
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-gray-500">
                Nom du compte
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold uppercase tracking-wide text-gray-500">
                Montant précédent (€)
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold uppercase tracking-wide text-gray-500">
                Montant prévu (€)
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-gray-500 bg-white shadow-sm"
                >
                  Chargement des charges...
                </td>
              </tr>
            ) : charges.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-gray-500 bg-white shadow-sm"
                >
                  Aucune ligne pour le moment. Ajoutez une charge pour commencer.
                </td>
              </tr>
            ) : (
              charges.map((row, index) => (
                <tr key={row._id || `nouveau-${index}`} className="bg-white shadow-sm">
                  <td className="px-4 py-3 align-middle">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={row.compte}
                      onChange={(event) => handleCompteChange(index, event.target.value)}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[#3F3F3F] focus:outline-none focus:ring-1 focus:ring-[#3F3F3F]"
                      placeholder="601000"
                    />
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <input
                      type="text"
                      value={row.nom}
                      onChange={(event) => handleTextChange(index, event.target.value)}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[#3F3F3F] focus:outline-none focus:ring-1 focus:ring-[#3F3F3F]"
                      placeholder="Libellé du compte"
                    />
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <input
                      type="number"
                      value={row.montantPrecedent}
                      onChange={(event) => handleNumberChange(index, "montantPrecedent", event.target.value)}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-right focus:border-[#3F3F3F] focus:outline-none focus:ring-1 focus:ring-[#3F3F3F]"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <input
                      type="number"
                      value={row.montantPrevu}
                      onChange={(event) => handleNumberChange(index, "montantPrevu", event.target.value)}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-right focus:border-[#3F3F3F] focus:outline-none focus:ring-1 focus:ring-[#3F3F3F]"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3 align-middle text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveRow(index)}
                        className="rounded-md bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600 transition disabled:cursor-not-allowed disabled:bg-green-300"
                        disabled={!row.isDirty || savingRowId === (row._id || `temp-${index}`)}
                      >
                        {savingRowId === (row._id || `temp-${index}`) ? "En cours..." : "Enregistrer"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 transition disabled:cursor-not-allowed"
                        disabled={savingRowId === (row._id || `temp-${index}`)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {charges.length > 0 && !isLoading && (
            <tfoot>
              <tr className="bg-gray-50">
                <td className="px-4 py-3 text-sm font-semibold text-gray-600">Totaux</td>
                <td></td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                  {totalPrecedent.toLocaleString("fr-FR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                  {totalPrevu.toLocaleString("fr-FR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default Charge;
