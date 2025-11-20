// VerifyEmail.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../api/axios";

export default function VerifyEmail() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const hasRun = useRef(false);

  // restore countdown dari localStorage
  useEffect(() => {
    const saved = localStorage.getItem("resendCooldown");
    if (saved) {
      const remaining = Math.floor((parseInt(saved, 10) - Date.now()) / 1000);
      if (remaining > 0) setCooldown(remaining);
    }
  }, []);

  useEffect(() => {
    const verify = async () => {
      if (hasRun.current) return;
      hasRun.current = true;

      try {
        await api.get(`/verify-email/${token}?email=${email}`, { timeout: 5000 });
        setStatus("success");
        setMessage("✅ Email berhasil diverifikasi!");
        setTimeout(() => navigate("/login?mode=login"), 4000);
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.message || "❌ Verifikasi gagal.");
      }
    };

    verify();
  }, [token, email, navigate]);

  // timer countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          localStorage.removeItem("resendCooldown");
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;

    try {
      await api.post("/resend-verification", { email });
      setStatus("sendmail");
      setMessage("📩 Email verifikasi sudah dikirim ulang.");
      const next = Date.now() + 180000; // 3 menit
      localStorage.setItem("resendCooldown", next.toString());
      setCooldown(180);
    } catch {
      setStatus("error");
      setMessage("⚠️ Gagal mengirim ulang email verifikasi.");
    }
  };

  const colorMap = {
    loading: "text-blue-600",
    success: "text-green-600",
    sendmail: "text-green-600",
    error: "text-red-500",
  };

  // format countdown (mm:ss)
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 px-4">
      <div className="bg-white shadow-lg rounded-xl p-8 max-w-md w-full text-center animate-fadeIn">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {status === "loading"
            ? "Memverifikasi Email..."
            : status === "success"
            ? "Verifikasi Berhasil"
            : "Verifikasi Gagal"}
        </h2>

        <p className={`text-sm mb-6 ${colorMap[status]}`}>{message}</p>

        {status === "loading" && (
          <div className="flex justify-center">
            <div className="w-6 h-6 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {(status === "error" || status === "sendmail") && (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleResend}
              disabled={cooldown > 0}
              className={`px-4 py-2 rounded-md transition-all ${
                cooldown > 0
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {cooldown > 0
                ? `Kirim Ulang (${formatTime(cooldown)})`
                : "Kirim Ulang Email"}
            </button>
            <button
              onClick={() => navigate("/login?mode=login")}
              className="text-gray-600 text-sm hover:text-gray-800"
            >
              Kembali ke Login
            </button>
          </div>
        )}

        {status === "success" && (
          <p className="text-gray-500 text-sm">
            Anda akan dialihkan ke halaman login...
          </p>
        )}
      </div>
    </div>
  );
}