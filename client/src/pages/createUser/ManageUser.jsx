import axios from "axios";
import { useEffect, useState, useRef } from "react";
import "./manageUsers.css";
import CreateUser from "./CreateUser";
import { formatDateSlash } from "../../utils/formatDate";
import RoleSelection from "./RoleSelection";
import DeleteUserButton from "./DeleteUserButton";
import useAuth from "../../hooks/useAuth";
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

const ManageUser = () => {
  const { isAdmin } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const searchNameRef = useRef("search_" + Math.random().toString(36).slice(2));
  const [addUserLabel, setAddUserLabel] = useState(() =>
    readStoredValue("users:add:button", "Ajouter un utilisateur")
  );
  const [searchTitle, setSearchTitle] = useState(() =>
    readStoredValue("users:search:title", "Rechercher")
  );
  const [searchPlaceholder, setSearchPlaceholder] = useState(() =>
    readStoredValue("users:search:placeholder", "Rechercher par nom, prénom ou email")
  );
  const [foundLabel, setFoundLabel] = useState(() =>
    readStoredValue("users:found:label", "Utilisateurs trouvés")
  );
  const [emptyLabel, setEmptyLabel] = useState(() =>
    readStoredValue("users:empty", "Aucun utilisateur trouvé.")
  );
  const [prevLabel, setPrevLabel] = useState(() =>
    readStoredValue("users:pagination:prev", "Précédent")
  );
  const [nextLabel, setNextLabel] = useState(() =>
    readStoredValue("users:pagination:next", "Suivant")
  );
  const [pageLabel, setPageLabel] = useState(() =>
    readStoredValue("users:pagination:page", "Page")
  );
  const [ofLabel, setOfLabel] = useState(() =>
    readStoredValue("users:pagination:of", "sur")
  );
  const [colName, setColName] = useState(() =>
    readStoredValue("users:table:name", "Nom / Prenom")
  );
  const [colEmail, setColEmail] = useState(() =>
    readStoredValue("users:table:email", "Email")
  );
  const [colRole, setColRole] = useState(() =>
    readStoredValue("users:table:role", "Role")
  );
  const [colDate, setColDate] = useState(() =>
    readStoredValue("users:table:date", "Date de création")
  );
  const [colActions, setColActions] = useState(() =>
    readStoredValue("users:table:actions", "Actions")
  );

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

  useEffect(() => {
    if (!isAdmin) {
      setIsEditing(false);
    }
  }, [isAdmin]);

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
        editMode={isEditing}
        onEditModeChange={setIsEditing}
        canEdit={isAdmin}
        actions={
          isAdmin ? (
            isEditing ? (
              <div className="w-full md:w-auto min-w-[220px] border-2 border-dashed border-[#3F3F3F] rounded-sm">
                <EditableText
                  storageKey="users:add:button"
                  defaultValue={addUserLabel}
                  isEditing={isEditing}
                  inputBaseClassName="text-white bg-[#3F3F3F] px-8 py-3 rounded text-sm w-full"
                  inputClassName="text-white font-medium text-center"
                  onValueChange={setAddUserLabel}
                />
              </div>
            ) : (
              <button
                className="text-white bg-[#3F3F3F] px-8 py-3 rounded text-sm w-full md:w-auto"
                onClick={() => setIsCreateUserOpen(true)}
              >
                {addUserLabel}
              </button>
            )
          ) : null
        }
      />

      <div className="mt-6">
        <EditableText
          storageKey="users:search:title"
          defaultValue={searchTitle}
          isEditing={isEditing && isAdmin}
          className=""
          inputClassName="text-sm font-semibold"
          onValueChange={setSearchTitle}
        />
        <div>
          {isEditing && isAdmin ? (
            <div className="border-2 border-dashed border-[#3F3F3F] rounded-md p-1">
              <EditableText
                storageKey="users:search:placeholder"
                defaultValue={searchPlaceholder}
                isEditing={isEditing}
                inputClassName="w-full py-2 px-2 text-sm"
                onValueChange={setSearchPlaceholder}
              />
            </div>
          ) : (
            <input
              type="text"
              name={searchNameRef.current}
              autoComplete="off"
              readOnly
              onFocus={(e) => e.target.removeAttribute('readonly')}
              className="w-full py-2 rounded px-2 border border-gray-300"
              value={searchTerm}
              onChange={handleSearch}
              placeholder={searchPlaceholder}
            />
          )}
        </div>
      </div>

      <p className="mt-8">
        <b>{filteredUsers.length}</b>{" "}
        <EditableText
          storageKey="users:found:label"
          defaultValue={foundLabel}
          isEditing={isEditing && isAdmin}
          onValueChange={setFoundLabel}
          as="span"
        />
      </p>

      <table
        className="w-full text-[#3F3F3F] mt-5 user-table "
        cellSpacing={10}
      >
        <thead>
          <tr className="bg-white rounded">
            <th>
              <EditableText
                storageKey="users:table:name"
                defaultValue={colName}
                isEditing={isEditing && isAdmin}
                onValueChange={setColName}
                as="span"
              />
            </th>
            <th>
              <EditableText
                storageKey="users:table:email"
                defaultValue={colEmail}
                isEditing={isEditing && isAdmin}
                onValueChange={setColEmail}
                as="span"
              />
            </th>
            <th>
              <EditableText
                storageKey="users:table:role"
                defaultValue={colRole}
                isEditing={isEditing && isAdmin}
                onValueChange={setColRole}
                as="span"
              />
            </th>
            <th>
              <EditableText
                storageKey="users:table:date"
                defaultValue={colDate}
                isEditing={isEditing && isAdmin}
                onValueChange={setColDate}
                as="span"
              />
            </th>
            {isAdmin && (
              <th>
                <EditableText
                  storageKey="users:table:actions"
                  defaultValue={colActions}
                  isEditing={isEditing && isAdmin}
                  onValueChange={setColActions}
                  as="span"
                />
              </th>
            )}
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
                <EditableText
                  storageKey="users:empty"
                  defaultValue={emptyLabel}
                  isEditing={isEditing && isAdmin}
                  onValueChange={setEmptyLabel}
                />
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
            <EditableText
              storageKey="users:pagination:prev"
              defaultValue={prevLabel}
              isEditing={isEditing && isAdmin}
              onValueChange={setPrevLabel}
              as="span"
            />
          </button>
          <span className="px-4 py-2 text text-black">
            <EditableText
              storageKey="users:pagination:page"
              defaultValue={pageLabel}
              isEditing={isEditing && isAdmin}
              onValueChange={setPageLabel}
              as="span"
            />{" "}
            {currentPage} {" "}
            <EditableText
              storageKey="users:pagination:of"
              defaultValue={ofLabel}
              isEditing={isEditing && isAdmin}
              onValueChange={setOfLabel}
              as="span"
            />{" "}
            {totalPages}
          </span>
          <button
            className="px-4 py-2 bg-[#3F3F3F] rounded-r text-white text-sm cursor-pointer disabled:opacity-50"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <EditableText
              storageKey="users:pagination:next"
              defaultValue={nextLabel}
              isEditing={isEditing && isAdmin}
              onValueChange={setNextLabel}
              as="span"
            />
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageUser;