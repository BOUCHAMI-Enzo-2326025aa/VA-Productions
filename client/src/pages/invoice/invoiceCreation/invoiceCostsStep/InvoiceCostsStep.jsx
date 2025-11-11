import React, { useState } from 'react';
import CreationSectionTitle from '../../CreationSectionTitle';
import InvoiceInput from '../../component/InvoiceInput';
import InvoiceButton from '../../component/InvoiceButton';

const InvoiceCostsStep = ({ nextPageFunction, previousPageFunction, addCost, deleteCost, costs }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleAddCost = () => {
    // On vérifie que les champs ne sont pas vides
    if (description && amount) {
      addCost(description, amount);
      // On réinitialise les champs après l'ajout
      setDescription('');
      setAmount('');
    }
  };

  return (
    <div className="bg-white w-full h-full py-8 px-9 rounded-md page-appear-animation">
      <CreationSectionTitle
        title={"Frais liés à la facture"}
        subtitle={"Ajoutez les frais de sous-traitance ou autres coûts associés."}
      />

      <div className="mt-8">
        <div className="flex items-end gap-3">
          <div className="w-full">
            <InvoiceInput
              title={"Description du frais"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="w-1/2">
            <InvoiceInput
              title={"Montant (€)"}
              inputType="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <InvoiceButton
            value={"Ajouter"}
            className={"!w-48 !py-2"}
            onClickFunction={handleAddCost}
          />
        </div>

        <div className="mt-8">
          <p className="font-bold text-[#3F3F3F]">Frais ajoutés :</p>
          {costs.length === 0 ? (
            <p className="text-gray-400 mt-2">Aucun frais ajouté pour le moment.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {costs.map((cost, index) => (
                <li key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span className="text-[#3F3F3F]">{cost.description}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-[#3F3F3F]">{cost.amount} €</span>
                    <button
                      onClick={() => deleteCost(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-12 w-full justify-between">
        <InvoiceButton
          primary={false}
          value={"Précédent"}
          onClickFunction={previousPageFunction}
        />
        <InvoiceButton
          value={"Suivant"}
          onClickFunction={nextPageFunction}
        />
      </div>
    </div>
  );
};

export default InvoiceCostsStep;