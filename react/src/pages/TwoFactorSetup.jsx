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
    <div className="flex flex-col items-center mt-10">
      <h2 className="text-xl font-bold mb-3">Aktifkan Google Authenticator</h2>
      {qr && (
        <img
          src={`data:image/svg+xml;base64,${qr}`}
          alt="QR Code"
          className="w-48 h-48 mb-4"
        />
      )}
      <input
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Masukkan kode 6 digit"
        className="border px-3 py-2 rounded w-48 text-center"
      />
      <button
        onClick={verify}
        className="bg-blue-600 text-white px-4 py-2 mt-3 rounded"
      >
        Verifikasi
      </button>
      <p className="mt-3 text-sm text-gray-600">{message}</p>
    </div>
  );
}
