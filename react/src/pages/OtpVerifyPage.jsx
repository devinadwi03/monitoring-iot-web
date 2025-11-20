// src/pages/OtpVerifyPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyOtp, resendOtp } from "../api/auth";
import api from "../api/axios";

export default function OtpVerifyPage({ onLogin }) {
  const [otp, setOtp] = useState("");
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [cooldown, setCooldown] = useState(0);
  const [otpType, setOtpType] = useState("email"); // "email" atau "google"
  const navigate = useNavigate();
  const location = useLocation();
  const rememberMe = location.state?.rememberMe || false;
  const email = location.state?.email || "";

  // Ambil tipe OTP dari URL (misal: /otp-verify?type=google)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get("type") || "email";
    setOtpType(type);
  }, [location.search]);

  // --- Ambil cooldown dari localStorage atau backend (state) ---
  useEffect(() => {
    if (otpType !== "email") return;

    let cooldownSeconds = 0;
    const stored = localStorage.getItem("otpCooldown");
    const fromBackend = location.state?.otpRemaining; // detik

    if (fromBackend) {
      cooldownSeconds = fromBackend;
      localStorage.setItem("otpCooldown", Date.now() + cooldownSeconds * 1000);
    } else if (stored) {
      const remaining = Math.ceil((parseInt(stored, 10) - Date.now()) / 1000);
      if (remaining > 0) cooldownSeconds = remaining;
    }

    if (cooldownSeconds > 0) {
      setCooldown(cooldownSeconds);
      setFeedback({
        text: "",
        type: "",
      });
    }
  }, [otpType, location.state]);

  // --- Timer hitung mundur ---
  useEffect(() => {
    if (otpType !== "email" || cooldown <= 0) return;

    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          localStorage.removeItem("otpCooldown");
          setFeedback({ type: "", text: "" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown, otpType]);

  // --- Kirim ulang OTP ---
  const handleResendOtp = async () => {
    try {
      await resendOtp(email);
      setOtp("");

      const remaining = 180; // default 3 menit
      localStorage.setItem("otpCooldown", Date.now() + remaining * 1000);
      setCooldown(remaining);

      setFeedback({
        text: `Kode OTP baru sudah dikirim`,
        type: "success",
      });
    } catch (err) {
      if (err.response?.data?.remaining) {
        const remaining = err.response.data.remaining;
        localStorage.setItem("otpCooldown", Date.now() + remaining * 1000);
        setCooldown(remaining);

        setFeedback({
          text: `Silakan tunggu ${formatTime(
            cooldown
          )} sebelum mengirim ulang OTP.`,
          type: "error",
        });
      } else {
        setFeedback({
          text: err.response?.data?.message || "Gagal mengirim ulang OTP.",
          type: "error",
        });
        const remaining = 0; // default 3 menit
        localStorage.setItem("otpCooldown", Date.now() + remaining * 1000);
        setCooldown(remaining);
      }
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    try {
      let userData;

      if (otpType === "email") {
        const data = await verifyOtp(otp, rememberMe);
        userData = data.user; // update state user
      } else if (otpType === "google") {
        // 🔹 Verifikasi Google Authenticator (login 2FA)
        const res = await api.post("/verify-google", {
          email,
          otp,
          rememberMe,
        });
        userData = res.data.user; // ambil user dari response
      }

      // 🔹 update state login di frontend
      onLogin(userData);

      setFeedback({
        type: "success",
        text: `✅ Login berhasil menggunakan ${
          otpType === "google" ? "Google Authenticator" : "OTP Email"
        }!`,
      });

      // redirect ke dashboard
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      // ✅ hanya tangani error dari endpoint OTP
      if (
        err.response?.config.url?.includes("/verify-otp") ||
        err.response?.config.url?.includes("/verify-google")
      ) {
        setFeedback({
          type: "error",
          text:
            err.response?.data?.message ||
            (otpType === "google"
              ? "Kode Google Authenticator salah."
              : "Verifikasi OTP gagal."),
        });
      } else {
        // error dari refresh-token atau interceptor jangan tampilkan di feedback OTP
        console.error("Global error (ignored in OTP page):", err);
        setFeedback({ text: "" });
      }
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleVerify}
        className="bg-white shadow-xl rounded-xl p-6 w-full max-w-sm mx-auto"
      >
        <h2 className="text-xl font-bold text-center text-blue-600 mb-4">
          {otpType === "google"
            ? "Verifikasi Google Authenticator"
            : "Verifikasi OTP Email"}
        </h2>

        <input
          type="text"
          maxLength="6"
          placeholder="Masukkan kode 6 digit"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
        />

        {feedback.text && (
          <div
            className={`mt-2 text-sm text-center ${
              feedback.type === "error" ? "text-red-500" : "text-green-600"
            }`}
          >
            {cooldown > 0 && feedback.type === "error"
              ? `Silakan tunggu ${formatTime(
                  cooldown
                )} sebelum kirim ulang OTP.`
              : feedback.text}
          </div>
        )}

        <button
          type="submit"
          className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          {otpType === "google" ? "Verifikasi 2FA" : "Verifikasi OTP"}
        </button>

        {otpType === "email" && (
          <p className="mt-4 text-center text-sm text-gray-600">
            Tidak menerima kode?{" "}
            {cooldown > 0 ? (
              <span className="text-gray-400">
                Kirim Ulang ({formatTime(cooldown)})
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-blue-500 hover:underline"
                disabled={cooldown > 0}
              >
                Kirim Ulang
              </button>
            )}
          </p>
        )}
      </form>
    </div>
  );
}
