import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function TwoFactorSetup({ onLogin }) {
  const [qr, setQr] = useState(null);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const rememberMe = location.state?.rememberMe || false;

  useEffect(() => {
    const getQr = async () => {
      const res = await api.get("/2fa/setup");
      setQr(res.data.qr);
    };
    getQr();
  }, []);

  const verify = async () => {
    try {
      let userData;
      const res = await api.post("/2fa/setup/verify", {
        otp,
        remember: rememberMe,
      });

      // ambil data user dari response backend
      userData = res.data.user;

      setMessage("✅ Google Authenticator berhasil diaktifkan!");
      onLogin(userData);

      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setMessage("❌ Kode OTP salah.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center px-4 pt-36 sm:pt-0 bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-md text-center ">
        <h2 className="text-xl font-bold text-center text-blue-600 mb-4">
          Aktifkan Google Authenticator
        </h2>
        {qr && (
          <img
            src={`data:image/svg+xml;base64,${qr}`}
            alt="QR Code"
            className="w-48 h-48 mx-auto"
          />
        )}
        <div className="flex flex-col items-center gap-3">
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Masukkan kode 6 digit"
            className="w-full border rounded-lg px-3 py-2 text-center text-lg tracking-widest
             focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={verify}
            className="mt-1 w-full bg-blue-500 hover:bg-blue-600
             text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Verifikasi
          </button>
          {message && (
            <p className="text-sm text-gray-600 text-center mt-2">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
