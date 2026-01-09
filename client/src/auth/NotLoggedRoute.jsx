import React, { useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

const NotLoggedRoute = ({ children }) => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Si l'utilisateur est déjà connecté, on le redirige vers le dashboard.
        // Exception: on laisse accessibles les pages liées à la réinitialisation de mot de passe.
        const pathname = location?.pathname || "";
        const isResetFlow =
            pathname.startsWith("/reset-password/") || pathname === "/mot-de-passe-oublie";

        if (token && !isResetFlow) {
            navigate("/dashboard", { replace: true });
        }
    }, [token, navigate, location]); 

    if (token) {
        return null; 
    }
    return <>{children}</>;
};

export default NotLoggedRoute;