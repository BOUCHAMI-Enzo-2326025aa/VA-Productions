import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard/Dashboard";
import Calendrier from "./pages/calendrier/Calendrier";
import Contact from "./pages/contacts/Contact";
import Layout from "./layout/Layout";
import Login from "./pages/login/Login";
import ManageUser from "./pages/createUser/ManageUser";
import ProtectedRoute from "./auth/ProtectedRoute";
import AdminRoute from "./auth/AdminRoute";
import axios from "axios";
import NotLoggedRoute from "./auth/NotLoggedRoute";
import InvoiceCreation from "./pages/invoice/invoiceCreation/InvoiceCreation";
import InvoiceDisplay from "./pages/invoice/invoiceDisplay/InvoiceDisplay";
import UserVerify from "./pages/user/verify/UserVerify";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import Order from "./pages/order/Order";
import Guide from "./pages/guide/Guide";
import Stats from "./pages/stats/Stats";
import Magazine from "./pages/magazine/Magazine";
import Charge from "./pages/charge/Charge";
import Settings from "./pages/settings/Settings";
import ForgotPassword from "./pages/password/ForgotPassword";
import ResetPassword from "./pages/password/ResetPassword";


axios.defaults.withCredentials = true;  

function App() {
  const [userLoaded, setUserLoaded] = useState(false);
  useEffect(() => {

     try {
      const userString = localStorage.getItem("user");
      if (userString) {
        JSON.parse(userString);
      }
    } catch (error) {
      console.error("Erreur localStorage, nettoyage...", error);
      localStorage.removeItem("user");
    }
    
    setUserLoaded(true);
  }, []);

  if (!userLoaded) {
    return <div>Loading...</div>;
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js")
        .then((registration) => {
          console.log(
            "Service Worker registered with scope:",
            registration.scope
          );
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    });
  }

  
    return (
    <MantineProvider>
      <BrowserRouter>
        <Routes>
          // Routes publiques (pas de connexion)
          <Route
            path="/connexion"
            element={
              <NotLoggedRoute>
                <Login />
              </NotLoggedRoute>
            }
          />
          <Route
            path="/user/verify/:email/:code"
            element={
              <NotLoggedRoute>
                <UserVerify />
              </NotLoggedRoute>
            }
          />

          <Route
            path="/mot-de-passe-oublie"
            element={
              <NotLoggedRoute>
                <ForgotPassword />
              </NotLoggedRoute>
            }
          />

          <Route
            path="/reset-password/:token"
            element={
              <NotLoggedRoute>
                <ResetPassword />
              </NotLoggedRoute>
            }
          />

          // Routes protégées (connexion requise)
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout pathName={"Dashboard"}>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendrier"
            element={
              <ProtectedRoute>
                <Layout pathName={"Calendrier"}>
                  <Calendrier />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <Layout pathName={"Contacts"}>
                  <Contact />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/user/create"
            element={
              <ProtectedRoute>
                <Layout pathName={"Administration"}>
                  <ManageUser />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/user"
            element={
              <ProtectedRoute>
                <Layout pathName={"Administration"}>
                  <ManageUser />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stats"
            element={
              <AdminRoute>
                <Layout pathName={"Statistiques"}>
                  <Stats />
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/magazine"
            element={
              <AdminRoute>
                <Layout pathName={"Magazines"}>
                  <Magazine />
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/charge"
            element={
              <AdminRoute>
                <Layout pathName={"Comptabilité"}>
                  <Charge />
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/invoice/create"
            element={
              <ProtectedRoute>
                <Layout pathName={"Factures"}>
                  <InvoiceCreation />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoice"
            element={
              <ProtectedRoute>
                <Layout pathName={"Factures"}>
                  <InvoiceDisplay />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/order"
            element={
              <ProtectedRoute>
                <Layout pathName={"Bons de Commande"}>
                  <Order />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout pathName={"Paramètres"}>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/guide"
            element={
              <ProtectedRoute>
                <Layout pathName={"Guide"}>
                  <Guide />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Route racine "/" */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout pathName={"Dashboard"}>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          {/* Route par défaut (catch-all) */}
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <Layout pathName={"Dashboard"}>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;