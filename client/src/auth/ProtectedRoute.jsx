import React, { useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            navigate("/connexion", { replace: true });
        }
    }, [token, navigate]);

    if (token) {
        return <>{children}</>;
    }

    return null;
};

export default ProtectedRoute;