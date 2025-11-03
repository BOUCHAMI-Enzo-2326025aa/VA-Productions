import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/dashboard/Dashboard";
import Calendrier from "./pages/calendrier/Calendrier";
import Contact from "./pages/contacts/Contact";
import Layout from "./layout/Layout";
import Login from "./pages/login/Login";
import CreateUser from "./pages/createUser/ManageUser";
import ProtectedRoute from "./auth/ProtectedRoute";
import AdminRoute from "./auth/AdminRoute";
import axios from "axios";
import NotLoggedRoute from "./auth/NotLoggedRoute";
import InvoiceCreation from "./pages/invoice/invoiceCreation/InvoiceCreation";
import UserList from "./pages/user/UserList";
import InvoiceDisplay from "./pages/invoice/invoiceDisplay/InvoiceDisplay";
import UserVerify from "./pages/user/verify/UserVerify";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import Order from "./pages/order/Order";
import Guide from "./pages/guide/Guide";
import Stats from "./pages/stats/Stats";

function App() {
  const [userLoaded, setUserLoaded] = useState(false);
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      axios.defaults.withCredentials = true;
      axios.defaults.headers.common["Authorization"] = user.token;
    }
    setUserLoaded(true);
  }, []);

  if (!userLoaded) {
    return <div>Loading...</div>; // TODO CHANGE BACKGROUND
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

          // Routes prortégées (connexion requise)
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
              <AdminRoute>
                <Layout pathName={"Administration"}>
                  <CreateUser />
                </Layout>
              </AdminRoute>
            }
          />
          <Route
            path="/admin/user"
            element={
              <AdminRoute>
                <Layout pathName={"Administration"}>
                  <UserList />
                </Layout>
              </AdminRoute>
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
            path="/guide"
            element={
              <ProtectedRoute>
                <Layout pathName={"Guide"}>
                  <Guide />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          // Route par défaut
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
