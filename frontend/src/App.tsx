import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { Layout } from "@/components/Layout";
import { MahasiswaLogin } from "@/pages/MahasiswaLogin";
import { MahasiswaForm } from "@/pages/MahasiswaForm";
import { AdminLogin } from "@/pages/AdminLogin";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { Panduan } from "@/pages/Panduan";

const MHS_KEY = "feb_penilaian_mhs";
const ADMIN_KEY = "feb_penilaian_admin_token";

interface MhsSession {
  nim: string;
  nama: string;
}

function App() {
  const [mhs, setMhs] = useState<MhsSession | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(MHS_KEY);
    if (raw) {
      try {
        setMhs(JSON.parse(raw) as MhsSession);
      } catch {
        sessionStorage.removeItem(MHS_KEY);
      }
    }
    const token = sessionStorage.getItem(ADMIN_KEY);
    if (token) setAdminToken(token);
  }, []);

  const handleMhsLogin = (nim: string, nama: string) => {
    const session = { nim, nama };
    setMhs(session);
    sessionStorage.setItem(MHS_KEY, JSON.stringify(session));
  };

  const handleMhsLogout = () => {
    setMhs(null);
    sessionStorage.removeItem(MHS_KEY);
  };

  const handleAdminLogin = (token: string) => {
    setAdminToken(token);
    sessionStorage.setItem(ADMIN_KEY, token);
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    sessionStorage.removeItem(ADMIN_KEY);
  };

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              mhs ? (
                <Navigate to="/form" replace />
              ) : (
                <MahasiswaLogin onLogin={handleMhsLogin} />
              )
            }
          />
          <Route
            path="/form"
            element={
              mhs ? (
                <MahasiswaForm nim={mhs.nim} nama={mhs.nama} onLogout={handleMhsLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/admin"
            element={
              adminToken ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <AdminLogin onLogin={handleAdminLogin} />
              )
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              adminToken ? (
                <AdminDashboard token={adminToken} onLogout={handleAdminLogout} />
              ) : (
                <Navigate to="/admin" replace />
              )
            }
          />
          <Route path="/panduan" element={<Panduan />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
