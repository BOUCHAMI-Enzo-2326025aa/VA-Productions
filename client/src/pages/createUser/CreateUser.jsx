import { useState } from "react";
import Input from "../../components/Input";
import Button from "../../components/ui/Button";
import axios from "axios";

const CreateUser = ({ closeCreationPage, fetchUser }) => {
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const createUser = async ({ email, nom, prenom }) => {
    try {
      setError("");
      setLoading(true);
      console.log('Tentative de création utilisateur:', { email, nom, prenom });
      
      const response = await axios.post(import.meta.env.VITE_API_HOST + "/api/user/create", {
        email: email,
        nom: nom,
        prenom: prenom,
      });
      
      console.log('Utilisateur créé avec succès:', response.data);
      await fetchUser();
      closeCreationPage();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      setError(error.response?.data?.erreur || "Erreur lors de la création de l'utilisateur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="absolute w-full h-screen top-0 left-0 creation-user-bg bg-black bg-opacity-70 flex justify-center items-center "
      onClick={closeCreationPage}
    >
      <div
        className="bg-white px-12 py-12 rounded min-w-[700px] creation-user-form-appear"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-bold text-lg">Création d'un utilisateur</p>
        <p className="opacity-70">
          Saisissez toutes les informations relatives au nouvel utilisateur
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
            {error}
          </div>
        )}

        <div className="flex mt-4 gap-1">
          <svg className="size-6 fill-[#3F3F3F]" viewBox="0 -960 960 960">
            <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z" />
          </svg>
          <p>Profil</p>
        </div>

        <div className="flex gap-2 w-full mt-4">
          <Input
            title="Nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            mandatory={true}
            style={"w-full"}
          />
          <Input
            title="Prenom"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            mandatory={true}
            style={"w-full"}
          />
        </div>
        <Input
          title="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          mandatory={true}
          style={"w-full mt-2"}
        />

        <Button
          value={loading ? "Création en cours..." : "Valider la création"}
          className="w-full mt-12"
          onClickFunction={() => {
            if (!loading) {
              createUser({ email, nom, prenom });
            }
          }}
        />
        <Button
          value="Annuler"
          className="w-full mt-2"
          primary={false}
          onClickFunction={closeCreationPage}
        />
      </div>
    </div>
  );
};

export default CreateUser;
