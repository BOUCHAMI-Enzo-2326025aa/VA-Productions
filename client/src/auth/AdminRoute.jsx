import React from "react";
import useAuth from "../hooks/useAuth";
import { Navigate } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const { user } = useAuth();

  // Vérifier si l'utilisateur est connecté
  if (!user || !user.token) {
    return <Navigate to={"/connexion"} replace />;
  }

  // Vérifier si l'utilisateur a le rôle admin
  if (user.role !== "admin") {
    return <Navigate to={"/dashboard"} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
