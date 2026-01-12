import { useMemo } from 'react';

const useAuth = () => {
  const storedString = localStorage.getItem("user");

  const authData = useMemo(() => {
    if (!storedString) {
      return { user: null, isAdmin: false };
    }
    try {
      const storedData = JSON.parse(storedString);
      
      const user = storedData.user || storedData; 
      const token = storedData.token || user?.token || null;

      if (user && user.role) {
        const normalizedRole = String(user.role || "").trim().toLowerCase();
        return {
          user: user,
          token,
          isAdmin: normalizedRole === 'admin',
        };
      }
      return { user: null, token: null, isAdmin: false };
    } catch (error) {
      console.error("Erreur parsing user localStorage", error);
      return { user: null, token: null, isAdmin: false };
    }
  }, [storedString]);

  return authData;
};

export default useAuth;