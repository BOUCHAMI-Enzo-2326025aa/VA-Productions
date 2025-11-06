import { useMemo } from 'react';

const useAuth = () => {
  const storedString = localStorage.getItem("user");

  const authData = useMemo(() => {
    if (!storedString) {
      return { user: null, token: null, isAdmin: false };
    }
    try {
      const storedData = JSON.parse(storedString);
      if (storedData && storedData.user && storedData.user.role) {
        return {
          user: storedData.user,
          token: storedData.token,
          isAdmin: storedData.user.role === 'admin',
        };
      }
      return { user: storedData.user || null, token: storedData.token || null, isAdmin: false };
    } catch (error) {
      console.error("Erreur en parsant les données utilisateur du localStorage", error);
      return { user: null, token: null, isAdmin: false };
    }
  }, [storedString]);

  return authData;
};

export default useAuth;