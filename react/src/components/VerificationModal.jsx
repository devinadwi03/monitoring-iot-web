// components/VerificationModal.jsx
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function VerificationModal({
  isOpen,
  onClose,
  email,
  onRedirect,
  onResend,
  type = "register", // "register" | "unverified"
}) {
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Load cooldown dari localStorage
  useEffect(() => {
    if (!email) return;
    const saved = localStorage.getItem(`resendCooldown_${email}`);
    if (saved) {
      const diff = Math.floor((Date.now() - parseInt(saved)) / 1000);
      if (diff < 180) setCooldown(180 - diff);
    }
  }, [email]);

  // Timer countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);


  if (!isOpen) return null;

  const handleResendClick = async () => {
    if (!onResend || resending || cooldown > 0) return;
    try {
      setResending(true);
      await onResend(email);
      toast.success("Email verifikasi telah dikirim ulang.");
      localStorage.setItem(`resendCooldown_${email}`, Date.now().toString());
      setCooldown(180);
    } catch {
      toast.error("Gagal mengirim ulang email verifikasi.");
    } finally {
      setResending(false);
    }
  };

  // format countdown (mm:ss)
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const title =
    type === "unverified" ? "Akun Belum Diverifikasi" : "Verifikasi Email";
  const description =
    type === "unverified"
      ? `Akun dengan email ${email} belum diverifikasi. Silakan periksa email Anda untuk melanjutkan.`
      : `Email verifikasi telah dikirim ke ${email}. Silakan cek inbox Anda untuk melanjutkan.`;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto text-center animate-fadeIn relative">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <p className="text-sm mb-4">{description}</p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleResendClick}
            disabled={resending || cooldown > 0}
            className={`px-4 py-2 rounded ${
              resending || cooldown > 0
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {resending
              ? "Mengirim..."
              : cooldown > 0
              ? `Kirim Ulang ${formatTime(cooldown)}`
              : "Kirim Ulang Email"}
          </button>

          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
            onClick={() => {
              onClose();
              onRedirect?.();
            }}
          >
            OK
          </button>
        </div>
        
      </div>
    </div>
  );
}
