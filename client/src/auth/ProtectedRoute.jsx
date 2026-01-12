import React, { useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth(); 
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate("/connexion", { replace: true });
        }
    }, [user, navigate]);

    if (user) {
        return <>{children}</>;
    }

    return null;
};

export default ProtectedRoute;