import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { getMe } from "./api/auth";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import DeviceDetailPage from "./pages/DeviceDetailPage";
import Navbar from "./components/Navbar";
import AddDevicePage from "./pages/AddDevicePage";
import AuthGuard from "./components/AuthGuard";
import AdminUserPage from "./pages/AdminUserPage";
import { logout } from "./api/auth";
import ProfilePage from "./pages/ProfilePage";
import OtpVerifyPage from "./pages/OtpVerifyPage";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import TwoFactorSetup from "./pages/TwoFactorSetup";
import DeviceTypeList from "./pages/DeviceTypeList";
import AddDeviceTypeForm from "./pages/AddDeviceTypeForm";
import EditDeviceTypeForm from "./pages/EditDeviceTypeForm";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

export default function App() {
  const [user, setUser] = useState(null); // default belum login
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const hideNavbarRoutes = [
    "/login",
    "/otp",
    "/verify-email",
    "/reset-password",
    "/twofactor-setup",
  ];
  const hideNavbar = hideNavbarRoutes.some((route) =>
    location.pathname.startsWith(route)
  );

  // cek token & fetch data user saat app mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const data = await getMe(); // panggil backend /me
        setUser(data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false); // selesai cek user
      }
    };
    checkUser();
  }, []);

  const handleLogin = (data) => setUser(data);
  const handleLogout = async () => {
    try {
      await logout(); // kirim request logout ke Laravel
      setUser(null); // reset state frontend
      toast.success(" Berhasil Logout");
    } catch (error) {
      console.error("Logout gagal:", error);
      setUser(null); // fallback: reset user meski request error
      toast.error(error.response?.data?.message || "Gagal Logout");
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-500 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!hideNavbar && user && <Navbar user={user} onLogout={handleLogout} />}

      <Routes>
        {/* login */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />
          }
        />

        {/* OTP */}
        <Route
          path="/otp"
          element={
            user ? <Navigate to="/" /> : <OtpVerifyPage onLogin={handleLogin} />
          }
        />

        {/* Setup Google Authenticator */}
        <Route
          path="/twofactor-setup"
          element={
            user ? (
              <Navigate to="/" />
            ) : (
              <TwoFactorSetup onLogin={handleLogin} />
            )
          }
        />

        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* dashboard */}
        <Route
          path="/"
          element={
            <AuthGuard user={user}>
              <DashboardPage />
            </AuthGuard>
          }
        />

        {/* detail device */}
        <Route
          path="/device/:deviceId"
          element={
            <AuthGuard user={user}>
              <DeviceDetailPage />
            </AuthGuard>
          }
        />

        {/* add device */}
        <Route
          path="/add-device"
          element={
            <AuthGuard user={user}>
              <AddDevicePage />
            </AuthGuard>
          }
        />

        {/* Admin Page (admin only) */}
        <Route
          path="/admin/device-types"
          element={
            <AuthGuard user={user} role="admin">
              <DeviceTypeList />
            </AuthGuard>
          }
        />

        <Route
          path="/admin/device-types/add"
          element={
            <AuthGuard user={user} role="admin">
              <AddDeviceTypeForm />
            </AuthGuard>
          }
        />

        <Route
          path="/admin/device-types/edit/:id"
          element={
            <AuthGuard user={user} role="admin">
              <EditDeviceTypeForm />
            </AuthGuard>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AuthGuard user={user} role="admin">
              <AdminUserPage currentUser={user} />
            </AuthGuard>
          }
        />

        <Route
          path="/profile"
          element={
            <AuthGuard user={user}>
              <ProfilePage />
            </AuthGuard>
          }
        />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { fontSize: "16px", borderRadius: "8px" },
        }}
      />
    </>
  );
}
