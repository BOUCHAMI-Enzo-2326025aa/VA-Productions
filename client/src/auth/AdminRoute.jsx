import React, { useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate("/connexion", { replace: true });
        } 
        else if (!isAdmin) {
            navigate("/dashboard", { replace: true });
        }
    }, [user, isAdmin, navigate]);

    if (user && isAdmin) {
        return <>{children}</>;
    }

    return null;
};

export default AdminRoute;