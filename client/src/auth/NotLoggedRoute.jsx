import React, { useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const NotLoggedRoute = ({ children }) => {
    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            navigate("/dashboard", { replace: true });
        }
    }, [token, navigate]); 

    if (token) {
        return null; 
    }
    return <>{children}</>;
};

export default NotLoggedRoute;