import { useState } from "react";
import axios from "axios";

const RoleSelection = ({ userId, initialRole, isAdmin }) => {
  const [role, setRole] = useState(initialRole || "commercial");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleChange = async (newRole) => {
    if (!isAdmin) return; // Seul un admin peut changer les rôles
    
    setIsUpdating(true);
    try {
      await axios.put(
        import.meta.env.VITE_API_HOST + `/api/user/${userId}/role`,
        { role: newRole },
        {
          headers: {
            Authorization: JSON.parse(localStorage.getItem("user"))?.token,
          },
        }
      );
      setRole(newRole);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du rôle:", error);
      alert("Erreur lors de la mise à jour du rôle");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <select
      className="bg-[#DBDEE1] font-semibold px-5 rounded py-2 role-selection"
      value={role}
      onChange={(e) => handleRoleChange(e.target.value)}
      disabled={!isAdmin || isUpdating}
    >
      <option value="commercial">Commercial</option>
      <option value="admin">Administrateur</option>
    </select>
  );
};

export default RoleSelection;
