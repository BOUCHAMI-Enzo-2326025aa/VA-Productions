import React, { useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
    const { token, isAdmin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!token) {
            navigate("/connexion", { replace: true });
        } 
        else if (!isAdmin) {
            navigate("/dashboard", { replace: true });
        }
    }, [token, isAdmin, navigate]);

    if (token && isAdmin) {
        return <>{children}</>;
    }

    return null;
};

export default AdminRoute;