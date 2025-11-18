import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Trash2 } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import refreshIcon from "../../assets/SaveIcon.svg";
import "./Charge.css"; // Importer le nouveau fichier CSS

const VIEW_OPTIONS = {
  CHARGES: "charges",
  RESULT: "result",
};

const createEmptyRow = (mode) => ({
  compte: "",
  nom: "",
  montantPrecedent: "0",
  montantPrevu: "0",
  montantResultat: "0",
  type: mode,
  isDirty: true,
  isNew: true,
});

const parseAmount = (value) => {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const cleaned = String(value).replace(/\s/g, "").replace(/,/g, ".");
  const num = Number.parseFloat(cleaned);
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
  montantResultat:
    typeof charge.montantResultat === "number"
      ? String(charge.montantResultat)
      : charge.montantResultat ?? "0",
  type: charge.isResultAccount ? VIEW_OPTIONS.RESULT : VIEW_OPTIONS.CHARGES,
  isDirty: false,
  isNew: false,
});

const Charge = () => {
  const { isAdmin } = useAuth();
  const [view, setView] = useState(VIEW_OPTIONS.CHARGES);
  const [charges, setCharges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingRowId, setSavingRowId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [resultTotal, setResultTotal] = useState(0);

  const isResultView = view === VIEW_OPTIONS.RESULT;

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    if (message) {
      setTimeout(() => setFeedback({ type: "", message: "" }), 3000);
    }
  };

  const fetchData = async (selectedView = view) => {
    setIsLoading(true);
    try {
      const requests = [
        axios.get(`${import.meta.env.VITE_API_HOST}/api/charge`, {
          params: { type: selectedView },
        }),
      ];

      if (selectedView !== VIEW_OPTIONS.RESULT) {
        requests.push(
          axios.get(`${import.meta.env.VITE_API_HOST}/api/charge`, {
            params: { type: VIEW_OPTIONS.RESULT },
          })
        );
      }

      const responses = await Promise.all(requests);
      const [currentResponse, resultResponse] = responses;

      const currentData = Array.isArray(currentResponse?.data?.charges)
        ? currentResponse.data.charges.map(mapCharge)
        : [];

      setCharges(
        currentData.filter((item) => item.type === selectedView)
      );

      let computedResultTotal = 0;

      if (selectedView === VIEW_OPTIONS.RESULT) {
        computedResultTotal = currentData.reduce(
          (sum, row) => sum + parseAmount(row.montantResultat),
          0
        );
      } else if (resultResponse) {
        const resultData = Array.isArray(resultResponse?.data?.charges)
          ? resultResponse.data.charges.map(mapCharge)
          : [];
        computedResultTotal = resultData.reduce(
          (sum, row) => sum + parseAmount(row.montantResultat),
          0
        );
      }

      setResultTotal(computedResultTotal);
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
      fetchData(view);
    } else {
      setIsLoading(false);
    }
  }, [isAdmin, view]);

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
    const sanitized = value.replace(/[^\d,.-]/g, "");
    updateRowAtIndex(index, { [field]: sanitized });
  };

  const handleAddRow = () => {
    setCharges((prev) => [...prev, createEmptyRow(view)]);
  };

  const validateRow = (row) => {
    if (!/^[0-9]{6}$/.test(row.compte)) {
      return "Le compte doit contenir exactement 6 chiffres.";
    }

    if (!row.nom.trim()) {
      return "Le nom du compte est obligatoire.";
    }

    const isResultRow = row.type === VIEW_OPTIONS.RESULT;

    if (isResultRow && row.montantResultat === "") {
      return "Le montant est obligatoire.";
    }

    if (!isResultRow) {
      if (row.montantPrecedent === "") {
        return "Le montant précédent est obligatoire.";
      }
      if (row.montantPrevu === "") {
        return "Le montant prévu est obligatoire.";
      }
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

    const rowType = row.type || view;
    const isResultRow = rowType === VIEW_OPTIONS.RESULT;

    const payload = {
      compte: row.compte,
      nom: row.nom.trim(),
      type: rowType,
      isResultAccount: isResultRow,
    };

    if (isResultRow) {
      payload.montantResultat = parseAmount(row.montantResultat);
    } else {
      payload.montantPrecedent = parseAmount(row.montantPrecedent);
      payload.montantPrevu = parseAmount(row.montantPrevu);
    }

    const tempId = row._id || `temp-${index}`;
    setSavingRowId(tempId);

    try {
      const applySavedCharge = (savedCharge) => {
        setCharges((prev) => {
          const next = prev.map((item, i) => (i === index ? savedCharge : item));
          if (view === VIEW_OPTIONS.RESULT) {
            const newTotal = next.reduce(
              (sum, item) => sum + parseAmount(item.montantResultat),
              0
            );
            setResultTotal(newTotal);
          }
          return next;
        });
      };

      if (row.isNew || !row._id) {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_HOST}/api/charge`,
          payload
        );
        const savedCharge = mapCharge(data.charge);
        applySavedCharge(savedCharge);
      } else {
        const { data } = await axios.put(
          `${import.meta.env.VITE_API_HOST}/api/charge/${row._id}`,
          payload
        );
        const savedCharge = mapCharge(data.charge);
        applySavedCharge(savedCharge);
      }
      showFeedback("success", "Ligne enregistrée avec succès.");
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

    const removeRowFromState = () => {
      setCharges((prev) => {
        const next = prev.filter((_, i) => i !== index);
        if (view === VIEW_OPTIONS.RESULT) {
          const newTotal = next.reduce(
            (sum, item) => sum + parseAmount(item.montantResultat),
            0
          );
          setResultTotal(newTotal);
        }
        return next;
      });
    };

    if (!row._id) {
      removeRowFromState();
      return;
    }

    setSavingRowId(row._id);
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_HOST}/api/charge/${row._id}`
      );
      removeRowFromState();
      showFeedback("success", "Ligne supprimée avec succès.");
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

  const totalPrecedent = useMemo(() => {
    if (isResultView) {
      return 0;
    }
    return charges.reduce(
      (sum, row) => sum + parseAmount(row.montantPrecedent),
      0
    );
  }, [charges, isResultView]);

  const totalPrevu = useMemo(() => {
    if (isResultView) {
      return 0;
    }
    return charges.reduce((sum, row) => sum + parseAmount(row.montantPrevu), 0);
  }, [charges, isResultView]);

  const totalResultat = useMemo(() => {
    if (!isResultView) {
      return 0;
    }
    return charges.reduce(
      (sum, row) => sum + parseAmount(row.montantResultat),
      0
    );
  }, [charges, isResultView]);

  const ecart = useMemo(
    () => (isResultView ? 0 : totalPrevu - totalPrecedent),
    [isResultView, totalPrecedent, totalPrevu]
  );

  const ecartClass = !isResultView
    ? ecart < 0
      ? "text-green-600"
      : ecart > 0
      ? "text-red-500"
      : "text-gray-600"
    : "text-gray-600";

  const controle = useMemo(
    () => (isResultView ? 0 : resultTotal - totalPrecedent),
    [isResultView, resultTotal, totalPrecedent]
  );

  const controleClass = controle > 0
    ? "text-red-500"
    : controle < 0
    ? "text-green-600"
    : "text-gray-600";

  const columnCount = isResultView ? 4 : 5;
  const viewDescription = isResultView
    ? "Renseignez les montants du compte de résultat pour chaque compte."
    : "Renseignez et ajustez les montants prévus pour chaque compte.";

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

      <div className="flex justify-between items-center mt-10 charge-header-container">
        <div>
          <div className="flex items-center gap-3">
            <select
              value={view}
              onChange={(event) => setView(event.target.value)}
              className="font-bold text-lg leading-3 text-[#3F3F3F] bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value={VIEW_OPTIONS.CHARGES}>Saisie des charges</option>
              <option value={VIEW_OPTIONS.RESULT}>Compte de résultat</option>
            </select>
          </div>
          <p className="opacity-80 mt-2">{viewDescription}</p>
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
        <table className="min-w-full border-separate border-spacing-y-2 charge-table">
          <thead>
            <tr className="bg-white shadow-sm">
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-gray-500">
                Compte (6 chiffres)
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-gray-500">
                Nom du compte
              </th>
              {isResultView ? (
                <th className="px-4 py-3 text-right text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Montant (€)
                </th>
              ) : (
                <>
                  <th className="px-4 py-3 text-right text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Montant précédent (€)
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Montant prévu (€)
                  </th>
                </>
              )}
              <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-4 py-6 text-center text-sm text-gray-500 bg-white shadow-sm"
                >
                  Chargement des données...
                </td>
              </tr>
            ) : charges.length === 0 ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-4 py-6 text-center text-sm text-gray-500 bg-white shadow-sm"
                >
                  Aucune ligne pour le moment. Ajoutez une entrée pour commencer.
                </td>
              </tr>
            ) : (
              charges.map((row, index) => (
                <tr key={row._id || `nouveau-${index}`}>
                  <td data-label="Compte">
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
                  <td data-label="Nom">
                    <input
                      type="text"
                      value={row.nom}
                      onChange={(event) => handleTextChange(index, event.target.value)}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[#3F3F3F] focus:outline-none focus:ring-1 focus:ring-[#3F3F3F]"
                      placeholder="Libellé du compte"
                    />
                  </td>
                  {isResultView ? (
                    <td data-label="Montant (€)">
                      <input
                        type="number"
                        value={row.montantResultat}
                        onChange={(event) =>
                          handleNumberChange(index, "montantResultat", event.target.value)
                        }
                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-right focus:border-[#3F3F3F] focus:outline-none focus:ring-1 focus:ring-[#3F3F3F]"
                        placeholder="0"
                      />
                    </td>
                  ) : (
                    <>
                      <td data-label="Montant précédent (€)">
                        <input
                          type="number"
                          value={row.montantPrecedent}
                          onChange={(event) =>
                            handleNumberChange(index, "montantPrecedent", event.target.value)
                          }
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-right focus:border-[#3F3F3F] focus:outline-none focus:ring-1 focus:ring-[#3F3F3F]"
                          placeholder="0"
                        />
                      </td>
                      <td data-label="Montant prévu (€)">
                        <input
                          type="number"
                          value={row.montantPrevu}
                          onChange={(event) =>
                            handleNumberChange(index, "montantPrevu", event.target.value)
                          }
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-right focus:border-[#3F3F3F] focus:outline-none focus:ring-1 focus:ring-[#3F3F3F]"
                          placeholder="0"
                        />
                      </td>
                    </>
                  )}
                  <td data-label="Actions">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveRow(index)}
                        className="flex h-9 w-9 items-center justify-center rounded-md bg-green-500 transition hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-green-300"
                        disabled={!row.isDirty || savingRowId === (row._id || `temp-${index}`)}
                        aria-label="Enregistrer la ligne"
                      >
                        {savingRowId === (row._id || `temp-${index}`) ? (
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                        ) : (
                          <img src={refreshIcon} alt="" className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed"
                        disabled={savingRowId === (row._id || `temp-${index}`)}
                        aria-label="Supprimer la ligne"
                      >
                        {savingRowId === (row._id || `temp-${index}`) ? (
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-r-transparent" />
                        ) : (
                          <Trash2 size={16} strokeWidth={1.75} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {charges.length > 0 && !isLoading && (
            <tfoot>
              {isResultView ? (
                <tr className="bg-gray-50">
                  <td data-label="Total" className="px-4 py-3 text-sm font-semibold text-gray-600">
                    Total
                  </td>
                  <td></td>
                  <td data-label="Total Montant" className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                    {totalResultat.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} €
                  </td>
                  <td></td>
                </tr>
              ) : (
                <>
                  <tr className="bg-gray-50">
                    <td data-label="Total des saisies" className="px-4 py-3 text-sm font-semibold text-gray-600">
                      Total des saisies
                    </td>
                    <td></td>
                    <td data-label="Total Précédent" className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                      {totalPrecedent.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} €
                    </td>
                    <td data-label="Total Prévu" className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                      {totalPrevu.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} €
                    </td>
                    <td></td>
                  </tr>
                  <tr className="bg-white">
                    <td data-label="Montant compte de résultat" className="px-4 py-3 text-sm font-semibold text-gray-600">
                      Montant issu du compte de résultat
                    </td>
                    <td></td>
                    <td></td>
                    <td data-label="Montant Résultat" className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                      {resultTotal.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} €
                    </td>
                    <td></td>
                  </tr>
                  <tr className="bg-white">
                    <td data-label="Contrôle" className="px-4 py-3 text-sm font-semibold text-gray-600">
                      Contrôle reste à saisir / trop saisi
                    </td>
                    <td></td>
                    <td></td>
                    <td data-label="Contrôle Montant" className={`px-4 py-3 text-right text-sm font-semibold ${controleClass}`}>
                      {controle.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} €
                    </td>
                    <td></td>
                  </tr>
                  <tr className="bg-white">
                    <td data-label="Écart N/N-1" className="px-4 py-3 text-sm font-semibold text-gray-600">
                      Ecart exercice en cours et précédent
                    </td>
                    <td></td>
                    <td></td>
                    <td data-label="Écart Montant" className={`px-4 py-3 text-right text-sm font-semibold ${ecartClass}`}>
                      {ecart.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} €
                    </td>
                    <td></td>
                  </tr>
                </>
              )}
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default Charge;