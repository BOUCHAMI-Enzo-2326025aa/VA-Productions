import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Trash2 } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import refreshIcon from "../../assets/SaveIcon.svg";
import "./Charge.css";
import PageHeader from "../../components/PageHeader";
import EditableText from "../../components/EditableText";

const readStoredValue = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw;
  } catch {
    return fallback;
  }
};

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
  const [isEditing, setIsEditing] = useState(false);
  const [view, setView] = useState(VIEW_OPTIONS.CHARGES);
  const [charges, setCharges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingRowId, setSavingRowId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [resultTotal, setResultTotal] = useState(0);
  const [chargesLabel, setChargesLabel] = useState(() =>
    readStoredValue("charge:label:charges", "Saisie des charges")
  );
  const [resultLabel, setResultLabel] = useState(() =>
    readStoredValue("charge:label:result", "Compte de résultat")
  );
  const [chargesDescription, setChargesDescription] = useState(() =>
    readStoredValue(
      "charge:description:charges",
      "Renseignez et ajustez les montants prévus pour chaque compte."
    )
  );
  const [resultDescription, setResultDescription] = useState(() =>
    readStoredValue(
      "charge:description:result",
      "Renseignez les montants du compte de résultat pour chaque compte."
    )
  );
  const [addRowLabel, setAddRowLabel] = useState(() =>
    readStoredValue("charge:button:add", "Ajouter une ligne")
  );
  const [headerAccount, setHeaderAccount] = useState(() =>
    readStoredValue("charge:header:account", "Compte (6 chiffres)")
  );
  const [headerName, setHeaderName] = useState(() =>
    readStoredValue("charge:header:name", "Nom du compte")
  );
  const [headerAmount, setHeaderAmount] = useState(() =>
    readStoredValue("charge:header:amount", "Montant (€)")
  );
  const [headerPrev, setHeaderPrev] = useState(() =>
    readStoredValue("charge:header:prev", "Montant précédent (€)")
  );
  const [headerPlanned, setHeaderPlanned] = useState(() =>
    readStoredValue("charge:header:planned", "Montant prévu (€)")
  );
  const [headerActions, setHeaderActions] = useState(() =>
    readStoredValue("charge:header:actions", "Actions")
  );
  const [loadingLabel, setLoadingLabel] = useState(() =>
    readStoredValue("charge:loading", "Chargement des données...")
  );
  const [emptyLabel, setEmptyLabel] = useState(() =>
    readStoredValue(
      "charge:empty",
      "Aucune ligne pour le moment. Ajoutez une entrée pour commencer."
    )
  );
  const [totalLabel, setTotalLabel] = useState(() =>
    readStoredValue("charge:footer:total", "Total")
  );
  const [totalEntriesLabel, setTotalEntriesLabel] = useState(() =>
    readStoredValue("charge:footer:entries", "Total des saisies")
  );
  const [totalPrevLabel, setTotalPrevLabel] = useState(() =>
    readStoredValue("charge:footer:prev", "Total précédent")
  );
  const [totalPlannedLabel, setTotalPlannedLabel] = useState(() =>
    readStoredValue("charge:footer:planned", "Total prévu")
  );
  const [resultFromAccountLabel, setResultFromAccountLabel] = useState(() =>
    readStoredValue(
      "charge:footer:result",
      "Montant issu du compte de résultat"
    )
  );
  const [controleLabel, setControleLabel] = useState(() =>
    readStoredValue(
      "charge:footer:controle",
      "Contrôle reste à saisir / trop saisi"
    )
  );
  const [ecartLabel, setEcartLabel] = useState(() =>
    readStoredValue(
      "charge:footer:ecart",
      "Ecart exercice en cours et précédent"
    )
  );
  const [confirmTitle, setConfirmTitle] = useState(() =>
    readStoredValue("charge:confirm:title", "Confirmer la suppression")
  );
  const [confirmPrefix, setConfirmPrefix] = useState(() =>
    readStoredValue(
      "charge:confirm:prefix",
      "Êtes-vous sûr de vouloir supprimer la ligne"
    )
  );
  const [confirmSuffix, setConfirmSuffix] = useState(() =>
    readStoredValue(
      "charge:confirm:suffix",
      "? Cette action est irréversible."
    )
  );
  const [cancelLabel, setCancelLabel] = useState(() =>
    readStoredValue("charge:confirm:cancel", "Annuler")
  );
  const [deleteLabel, setDeleteLabel] = useState(() =>
    readStoredValue("charge:confirm:delete", "Supprimer")
  );
  
  // État pour la modal de confirmation de suppression
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    rowIndex: null,
    rowName: "",
  });

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

  useEffect(() => {
    if (!isAdmin) {
      setIsEditing(false);
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
      setDeleteConfirm({ isOpen: false, rowIndex: null, rowName: "" });
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
      setDeleteConfirm({ isOpen: false, rowIndex: null, rowName: "" });
    }
  };

  const openDeleteConfirm = (index) => {
    const row = charges[index];
    setDeleteConfirm({
      isOpen: true,
      rowIndex: index,
      rowName: row.nom || `Ligne ${index + 1}`,
    });
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm({ isOpen: false, rowIndex: null, rowName: "" });
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
    ? resultDescription
    : chargesDescription;

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

      <PageHeader
        title={view === VIEW_OPTIONS.RESULT ? resultLabel : chargesLabel}
        description={viewDescription}
        storageKey={`page-header:charge:${view}`}
        className="mt-10 charge-header-container"
        editMode={isEditing}
        onEditModeChange={setIsEditing}
        canEdit={isAdmin}
        actions={
          <>
            <select
              value={view}
              onChange={(event) => setView(event.target.value)}
              className="font-bold text-lg leading-3 text-[#3F3F3F] bg-transparent border border-transparent focus:outline-none cursor-pointer"
            >
              <option value={VIEW_OPTIONS.CHARGES}>{chargesLabel}</option>
              <option value={VIEW_OPTIONS.RESULT}>{resultLabel}</option>
            </select>
            <button
              type="button"
              onClick={handleAddRow}
              className="bg-[#3F3F3F] text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-80 transition"
            >
              {addRowLabel}
            </button>
          </>
        }
      />

      {isEditing && isAdmin && (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <EditableText
            storageKey="charge:label:charges"
            defaultValue={chargesLabel}
            isEditing={isEditing}
            inputClassName="text-sm"
            onValueChange={setChargesLabel}
          />
          <EditableText
            storageKey="charge:label:result"
            defaultValue={resultLabel}
            isEditing={isEditing}
            inputClassName="text-sm"
            onValueChange={setResultLabel}
          />
          <EditableText
            storageKey="charge:description:charges"
            defaultValue={chargesDescription}
            isEditing={isEditing}
            inputClassName="text-sm"
            onValueChange={setChargesDescription}
          />
          <EditableText
            storageKey="charge:description:result"
            defaultValue={resultDescription}
            isEditing={isEditing}
            inputClassName="text-sm"
            onValueChange={setResultDescription}
          />
          <EditableText
            storageKey="charge:button:add"
            defaultValue={addRowLabel}
            isEditing={isEditing}
            inputClassName="text-sm"
            onValueChange={setAddRowLabel}
          />
          <EditableText
            storageKey="charge:footer:prev"
            defaultValue={totalPrevLabel}
            isEditing={isEditing}
            inputClassName="text-sm"
            onValueChange={setTotalPrevLabel}
          />
          <EditableText
            storageKey="charge:footer:planned"
            defaultValue={totalPlannedLabel}
            isEditing={isEditing}
            inputClassName="text-sm"
            onValueChange={setTotalPlannedLabel}
          />
        </div>
      )}

      <div className="mt-8 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 charge-table">
          <thead>
            <tr className="bg-white shadow-sm">
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-gray-500">
                <EditableText
                  storageKey="charge:header:account"
                  defaultValue={headerAccount}
                  isEditing={isEditing && isAdmin}
                  onValueChange={setHeaderAccount}
                  as="span"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-gray-500">
                <EditableText
                  storageKey="charge:header:name"
                  defaultValue={headerName}
                  isEditing={isEditing && isAdmin}
                  onValueChange={setHeaderName}
                  as="span"
                />
              </th>
              {isResultView ? (
                <th className="px-4 py-3 text-right text-sm font-semibold uppercase tracking-wide text-gray-500">
                  <EditableText
                    storageKey="charge:header:amount"
                    defaultValue={headerAmount}
                    isEditing={isEditing && isAdmin}
                    onValueChange={setHeaderAmount}
                    as="span"
                  />
                </th>
              ) : (
                <>
                  <th className="px-4 py-3 text-right text-sm font-semibold uppercase tracking-wide text-gray-500">
                    <EditableText
                      storageKey="charge:header:prev"
                      defaultValue={headerPrev}
                      isEditing={isEditing && isAdmin}
                      onValueChange={setHeaderPrev}
                      as="span"
                    />
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold uppercase tracking-wide text-gray-500">
                    <EditableText
                      storageKey="charge:header:planned"
                      defaultValue={headerPlanned}
                      isEditing={isEditing && isAdmin}
                      onValueChange={setHeaderPlanned}
                      as="span"
                    />
                  </th>
                </>
              )}
              <th className="px-4 py-3 text-center text-sm font-semibold uppercase tracking-wide text-gray-500">
                <EditableText
                  storageKey="charge:header:actions"
                  defaultValue={headerActions}
                  isEditing={isEditing && isAdmin}
                  onValueChange={setHeaderActions}
                  as="span"
                />
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
                  <EditableText
                    storageKey="charge:loading"
                    defaultValue={loadingLabel}
                    isEditing={isEditing && isAdmin}
                    onValueChange={setLoadingLabel}
                  />
                </td>
              </tr>
            ) : charges.length === 0 ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-4 py-6 text-center text-sm text-gray-500 bg-white shadow-sm"
                >
                  <EditableText
                    storageKey="charge:empty"
                    defaultValue={emptyLabel}
                    isEditing={isEditing && isAdmin}
                    onValueChange={setEmptyLabel}
                  />
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
                        onClick={() => openDeleteConfirm(index)}
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
                    <EditableText
                      storageKey="charge:footer:total"
                      defaultValue={totalLabel}
                      isEditing={isEditing && isAdmin}
                      onValueChange={setTotalLabel}
                      as="span"
                    />
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
                      <EditableText
                        storageKey="charge:footer:entries"
                        defaultValue={totalEntriesLabel}
                        isEditing={isEditing && isAdmin}
                        onValueChange={setTotalEntriesLabel}
                        as="span"
                      />
                    </td>
                    <td></td>
                    <td data-label={totalPrevLabel} className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                      {totalPrecedent.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} €
                    </td>
                    <td data-label={totalPlannedLabel} className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                      {totalPrevu.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} €
                    </td>
                    <td></td>
                  </tr>
                  <tr className="bg-white">
                    <td data-label="Montant compte de résultat" className="px-4 py-3 text-sm font-semibold text-gray-600">
                      <EditableText
                        storageKey="charge:footer:result"
                        defaultValue={resultFromAccountLabel}
                        isEditing={isEditing && isAdmin}
                        onValueChange={setResultFromAccountLabel}
                        as="span"
                      />
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
                      <EditableText
                        storageKey="charge:footer:controle"
                        defaultValue={controleLabel}
                        isEditing={isEditing && isAdmin}
                        onValueChange={setControleLabel}
                        as="span"
                      />
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
                      <EditableText
                        storageKey="charge:footer:ecart"
                        defaultValue={ecartLabel}
                        isEditing={isEditing && isAdmin}
                        onValueChange={setEcartLabel}
                        as="span"
                      />
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

      {/* Modal de confirmation de suppression */}
      {deleteConfirm.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={closeDeleteConfirm}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              <EditableText
                storageKey="charge:confirm:title"
                defaultValue={confirmTitle}
                isEditing={isEditing && isAdmin}
                onValueChange={setConfirmTitle}
                as="span"
              />
            </h3>
            <p className="text-gray-600 mb-6">
              <EditableText
                storageKey="charge:confirm:prefix"
                defaultValue={confirmPrefix}
                isEditing={isEditing && isAdmin}
                onValueChange={setConfirmPrefix}
                as="span"
              />{" "}
              "{deleteConfirm.rowName}"
              <EditableText
                storageKey="charge:confirm:suffix"
                defaultValue={confirmSuffix}
                isEditing={isEditing && isAdmin}
                onValueChange={setConfirmSuffix}
                as="span"
              />
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition"
              >
                <EditableText
                  storageKey="charge:confirm:cancel"
                  defaultValue={cancelLabel}
                  isEditing={isEditing && isAdmin}
                  onValueChange={setCancelLabel}
                  as="span"
                />
              </button>
              <button
                type="button"
                onClick={() => handleRemoveRow(deleteConfirm.rowIndex)}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition"
              >
                <EditableText
                  storageKey="charge:confirm:delete"
                  defaultValue={deleteLabel}
                  isEditing={isEditing && isAdmin}
                  onValueChange={setDeleteLabel}
                  as="span"
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Charge;