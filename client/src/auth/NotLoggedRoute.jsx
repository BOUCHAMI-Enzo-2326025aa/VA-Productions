import React, { useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

const NotLoggedRoute = ({ children }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // ne pas rediriger si on est sur reset password
        const pathname = location?.pathname || "";
        const isResetFlow =
            pathname.startsWith("/reset-password/") || pathname === "/mot-de-passe-oublie";

        // Si l'utilisateur est connecté et qu'il n'essaie pas de reset son mot de passe
        if (user && !isResetFlow) {
            navigate("/dashboard", { replace: true });
        }
    }, [user, navigate, location]); 
    const pathname = location?.pathname || "";
    const isResetFlow = pathname.startsWith("/reset-password/") || pathname === "/mot-de-passe-oublie";

    if (user && !isResetFlow) {
        return null; 
    }
    
    return <>{children}</>;
};

export default NotLoggedRoute;