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

      if (user && user.role) {
        return {
          user: user,
          token: null, 
          isAdmin: user.role === 'admin',
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