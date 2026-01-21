import axios from "axios";
import { useEffect, useState, useRef } from "react";
import "./manageUsers.css";
import CreateUser from "./CreateUser";
import { formatDateSlash } from "../../utils/formatDate";
import RoleSelection from "./RoleSelection";
import DeleteUserButton from "./DeleteUserButton";
import useAuth from "../../hooks/useAuth";
import PageHeader from "../../components/PageHeader";

const ManageUser = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const searchNameRef = useRef("search_" + Math.random().toString(36).slice(2));

  const fetchUsers = async () => {
    try {
      const res = await axios.get(import.meta.env.VITE_API_HOST + "/api/user/");
      const allUsers = res.data.userList;
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs :", error);
    }
  };

  const handleUserDeleted = (userId) => {
    setUsers((prev) => prev.filter((user) => user._id !== userId));
    setFilteredUsers((prev) => prev.filter((user) => user._id !== userId));
  };

  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = users.filter((user) => {
      const nom = user.nom ? user.nom.toLowerCase() : "";
      const prenom = user.prenom ? user.prenom.toLowerCase() : "";
      const email = user.email ? user.email.toLowerCase() : "";
      return nom.includes(term) || prenom.includes(term) || email.includes(term);
    });
    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const paginate = (users) => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return users.slice(startIndex, startIndex + usersPerPage);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="flex flex-col mt-10 md:mt-16 min-h-screen text-[#3F3F3F] w-full ">
      {isCreateUserOpen && (
        <CreateUser
          closeCreationPage={() => setIsCreateUserOpen(false)}
          fetchUser={fetchUsers}
        />
      )}

      <PageHeader
        title="Membres"
        description="Gérez les comptes utilisateurs et leurs rôles"
        storageKey="page-header:administration-utilisateurs"
        className="md:items-center"
        titleClassName="text-2xl"
        actions={
          isAdmin ? (
            <button
              className="text-white bg-[#3F3F3F] px-8 py-3 rounded text-sm w-full md:w-auto"
              onClick={() => setIsCreateUserOpen(true)}
            >
              Ajouter un utilisateur
            </button>
          ) : null
        }
      />

      <div className="mt-6">
        <p>Rechercher</p>
        <div>
          <input
            type="text"
            name={searchNameRef.current}
            autoComplete="off"
            readOnly
            onFocus={(e) => e.target.removeAttribute('readonly')}
            className="w-full py-2 rounded px-2 border border-gray-300"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Rechercher par nom, prénom ou email"
          />
        </div>
      </div>

      <p className="mt-8">
        <b>{filteredUsers.length}</b> Utilisateurs trouvés
      </p>

      <table
        className="w-full text-[#3F3F3F] mt-5 user-table "
        cellSpacing={10}
      >
        <thead>
          <tr className="bg-white rounded">
            <th>Nom / Prenom</th>
            <th>Email</th>
            <th>Role</th>
            <th>Date de création</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length > 0 ? (
            paginate(filteredUsers).map((user) => (
              <tr key={user._id}>
                <td data-label="Nom / Prénom" className="font-semibold">
                  {user.nom && user.prenom && `${user.nom.toUpperCase()} ${user.prenom}`}
                </td>
                <td data-label="Email">{user.email}</td>
                <td data-label="Rôle">
                  <RoleSelection 
                    userId={user._id} 
                    initialRole={user.role} 
                    isAdmin={isAdmin}
                  />
                </td>
                <td data-label="Date de création">{formatDateSlash(user.creationDate)}</td>
                {isAdmin && (
                  <td data-label="Actions">
                    <DeleteUserButton
                      userId={user._id}
                      userName={`${user.nom} ${user.prenom}`}
                      isAdmin={isAdmin}
                      onUserDeleted={handleUserDeleted}
                    />
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={isAdmin ? "5" : "4"} className="text-center py-4">
                Aucun utilisateur trouvé.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4">
          <button
            className="px-4 py-2 bg-[#3F3F3F] rounded-l text-white text-sm cursor-pointer disabled:opacity-50"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Précédent
          </button>
          <span className="px-4 py-2 text text-black">
            Page {currentPage} sur {totalPages}
          </span>
          <button
            className="px-4 py-2 bg-[#3F3F3F] rounded-r text-white text-sm cursor-pointer disabled:opacity-50"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageUser;