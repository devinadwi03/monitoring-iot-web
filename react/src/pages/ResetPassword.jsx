import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPassword } from "../api/auth";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { validatePassword } from "../utils/passwordValidator";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const token = query.get("token");
  const email = query.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { valid, errors } = validatePassword(password);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success"); // "success" | "error"

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Password tidak sama dengan konfirmasi");
      return;
    }

    try {
      await resetPassword(email, token, password, confirmPassword);
      setError("");
      setModalType("success");
      setModalMessage(
        "Password berhasil direset. Kamu akan diarahkan ke halaman login dalam 5 detik..."
      );
      setModalOpen(true);

      // Auto redirect setelah 5 detik
      setTimeout(() => {
        navigate("/login");
      }, 5000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Reset password gagal";
      if (
        errorMsg.includes("Token tidak valid") ||
        errorMsg.includes("kadaluarsa")
      ) {
        setModalType("error");
        setModalMessage(
          "Token sudah tidak berlaku. Silakan minta link reset password baru."
        );
        setModalOpen(true);

        // Arahkan ke halaman login dalam mode forgot
        setTimeout(() => {
          navigate("/login?mode=forgot");
        }, 3000);
      } else {
        setModalType("error");
        setModalMessage(errorMsg);
        setModalOpen(true);
      }
    }
  };

  const isPasswordMatch =
    password && confirmPassword && password === confirmPassword;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
          Reset Password
        </h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password Baru"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2 text-sm text-gray-500"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
            {/* Feedback realtime */}
            {password.length > 0 && (
              <ul className="mt-2 text-xs">
                {errors.map((err, i) => (
                  <li key={i} className="text-red-500">
                    ❌ {err}
                  </li>
                ))}
                {valid && <li className="text-green-600">✅ Password kuat</li>}
              </ul>
            )}
          </div>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Konfirmasi Password Baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-2 text-sm text-gray-500"
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Feedback realtime */}
          {confirmPassword && (
            <p
              className={`mt-2 text-xs ${
                isPasswordMatch ? "text-green-600" : "text-red-500"
              }`}
            >
              {isPasswordMatch ? "Password cocok ✔" : "Password tidak sama "}
            </p>
          )}

          <button
            type="submit"
            disabled={!isPasswordMatch}
            className={`w-full py-2 rounded-lg ${
              isPasswordMatch
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Reset Password
          </button>
        </form>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
            <h2
              className={`text-lg font-semibold mb-2 ${
                modalType === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {modalType === "success" ? "Berhasil!" : "Terjadi Kesalahan"}
            </h2>
            <p className="mb-4 text-gray-700">{modalMessage}</p>
            {modalType === "error" && (
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Tutup
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
