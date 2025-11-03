import { useState } from "react";
import Input from "../../components/Input";
import Button from "../../components/ui/Button";
import axios from "axios";

const CreateUser = ({ closeCreationPage, fetchUser }) => {
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");

  const createUser = async ({ email, nom, prenom }) => {
    await axios.post(import.meta.env.VITE_API_HOST + "/api/user/create", {
      email: email,
      nom: nom,
      prenom: prenom,
    });
    fetchUser();
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
          value="Valider la création"
          className="w-full mt-12"
          onClickFunction={() => {
            createUser({ email, nom, prenom });
            closeCreationPage();
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
