import { useEffect, useState } from "react";
import ClientInformationsStep from "./clientInformationStep/ClientInformationsStep";
import InvoiceCreationStepFollow from "./invoiceCreationStepFollow/InvoiceCreationStepFollow";
import InvoiceSummary from "./invoiceSummary/InvoiceSummary";
import InvoiceSupportChoice from "./invoiceSupportChoice/InvoiceSupportChoice";
import ClientFacturationInfo from "./clientFacturationInfo/ClientFacturationInfo";
import InvoiceConfirm from "./invoiceConfirm/InvoiceConfirm";
import axios from "axios";
import "./invoice.css";
import LoadingScreen from "./LoadingScreen";
import InvoiceCostsStep from "./invoiceCostsStep/InvoiceCostsStep";

const InvoiceCreation = () => {
  const [step, setStep] = useState(1);
  const [contactList, setContactList] = useState([]);
  const [TVA_PERCENTAGE, setTVA_PERCENTAGE] = useState(0.2);
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState({
    client: {
      clientId: "",
      compagnyName: "",
      name: "",
      surname: "",
      email: "",
      phone: "",
      address1: "",
      address2: "",
      city: "",
      postalCode: "",
      totalPrice: 0,
      support: [],
      signature: null,
      costs: [], 
    },
  });

  const fetchContact = async () => {
    try {
      const response = await axios.get(import.meta.env.VITE_API_HOST + "/api/contact/");
      setContactList(response.data.contactList);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchContact();
  }, []);

  const deleteSupport = (index) => {
    const newSupportList = invoice.client.support.filter((_, i) => i !== index);
    handleClientChange("support", newSupportList);
  };

  const handleClientChange = (field, value) => {
    setInvoice((prevState) => ({
      ...prevState,
      client: {
        ...prevState.client,
        [field]: value,
      },
    }));
  };

  const createNewSupport = (libelle, supportNumber, price, supportName, image) => {
    const newSupport = {
      name: libelle,
      price: parseFloat(price) || 0, 
      supportName: supportName,
      supportNumber: supportNumber,
      image: image,
    };
    handleClientChange("support", [...invoice.client.support, newSupport]);
  };
  
  const addCost = (description, amount) => {
    const newCost = { description, amount: parseFloat(amount) || 0 };
    handleClientChange("costs", [...invoice.client.costs, newCost]);
  };

  const deleteCost = (index) => {
    const newCosts = invoice.client.costs.filter((_, i) => i !== index);
    handleClientChange("costs", newCosts);
  };

  const createOrder = async () => {
    increaseStep(); 
    setLoading(true);

    const totalPrice = invoice.client.support.reduce((sum, item) => sum + (item.price || 0), 0);
    const updatedClientData = { ...invoice.client, totalPrice };

    const tva = { percentage: TVA_PERCENTAGE };

    try {
      const response = await axios.post(
        import.meta.env.VITE_API_HOST + "/api/order/create",
        { invoice: { client: updatedClientData }, tva },
        { responseType: "blob" }
      );

      if (response.status === 200) {
        const contentDisposition = response.headers["content-disposition"];
        let fileName = "bon-de-commande.pdf";
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          if (fileNameMatch && fileNameMatch[1]) {
            fileName = fileNameMatch[1];
          }
        }
        const blob = response.data;
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);

        setLoading(false); 
      } else {
        console.error("Erreur serveur lors de la création de la commande.");
        alert("Une erreur est survenue côté serveur.");
        setLoading(false);
        decreaseStep();
      }
    } catch (error) {
      console.error("Erreur critique lors de l'appel API :", error);
      alert("Une erreur de connexion est survenue. Vérifiez la console.");
      setLoading(false);
      decreaseStep(); 
    }
  };

  const increaseStep = () => setStep(step + 1);
  const decreaseStep = () => setStep(step - 1);

  return (
    <div className="flex gap-2 mt-8">
      {step === 6 && <LoadingScreen loading={loading} />} 
      
      {step < 5 && (
        <div className="flex flex-col w-[50%] max-w-[450px] min-w-[450px] gap-2 overflow-hidden">
          <InvoiceCreationStepFollow step={step} />
          {step > 1 && <InvoiceSummary supportList={invoice.client.support} costList={invoice.client.costs} />}
        </div>
      )}
      
      {step === 1 && (
        <ClientInformationsStep
          contactList={contactList}
          invoice={invoice}
          nextStepFunction={increaseStep}
          handleChange={handleClientChange}
          changeTVA={setTVA_PERCENTAGE}
        />
      )}
      {step === 2 && (
        <InvoiceSupportChoice
          nextPageFunction={increaseStep}
          previousPageFunction={decreaseStep}
          createNewSupport={createNewSupport}
          deleteSupport={deleteSupport}
          createdSupports={invoice.client.support}
        />
      )}
      {step === 3 && (
        <InvoiceCostsStep
          nextPageFunction={increaseStep}
          previousPageFunction={decreaseStep}
          addCost={addCost}
          deleteCost={deleteCost}
          costs={invoice.client.costs}
        />
      )}
      {step === 4 && (
        <ClientFacturationInfo
          nextPageFunction={increaseStep}
          previousPageFunction={decreaseStep}
          handleChange={handleClientChange}
          invoice={invoice}
        />
      )}
      {step === 5 && (
        <InvoiceConfirm
          invoice={invoice}
          supportList={invoice.client.support}
          costList={invoice.client.costs}
          createOrder={createOrder}
          handleChange={handleClientChange}
          returnFunction={decreaseStep}
          TVA_PERCENTAGE={TVA_PERCENTAGE}
        />
      )}
    </div>
  );
};

export default InvoiceCreation;