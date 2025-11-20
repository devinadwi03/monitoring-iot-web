import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginWithOtp, register, forgotPassword } from "../api/auth";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { validatePassword } from "../utils/passwordValidator";
import { SiGoogleauthenticator, SiGmail } from "react-icons/si";
import VerificationModal from "../components/VerificationModal";
import api from "../api/axios";

export default function LoginPage({ onLogin }) {
  //const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { valid, errors } = validatePassword(password);

  const [rememberMe, setRememberMe] = useState(false);
  const [feedback, setFeedback] = useState({ text: "", type: "" });
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [modalType, setModalType] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();

  // ✅ Remember Me (email + cookie Laravel)
  useEffect(() => {
    if (mode === "login") {
      const savedEmail = localStorage.getItem("rememberEmail");
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } else {
      setEmail(""); // ✅ kosongkan kalau bukan login
      setRememberMe(false);
    }
  }, [mode]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    try {
      if (mode === "register") {
        if (password !== confirmPassword) {
          setFeedback({
            type: "error",
            text: "Konfirmasi password tidak sama",
          });
          return;
        }
        await register({
          name,
          email,
          password,
          confirmPassword,
          role: "user",
        });
        setShowVerificationModal(true);
        setModalType("register");
      } else if (mode === "login") {
        if (!email || !password) {
          setFeedback({
            type: "error",
            text: "Isi email dan password terlebih dahulu",
          });
          return;
        }
        try {
          // step 1: kirim email & password untuk generate OTP (include remember)
          await loginWithOtp(email, password, rememberMe);

          // simpan email kalau rememberMe dicentang
          if (rememberMe) {
            localStorage.setItem("rememberEmail", email);
          } else {
            localStorage.removeItem("rememberEmail");
          }

          // step 2: user dialihkan ke halaman OTP
          navigate("/otp?type=email", {
            state: { email, rememberMe: rememberMe },
          });
        } catch (err) {
          const message = err.response?.data?.message || "Login gagal";

          // kalau backend kasih status 403 atau pesan tertentu
          if (
            err.response?.status === 403 ||
            message.toLowerCase().includes("belum diverifikasi")
          ) {
            setShowVerificationModal(true);
            setModalType("unverified");
          } else {
            setFeedback({
              type: "error",
              text: message,
            });
          }
        }
      } else if (mode === "forgot") {
        await forgotPassword(email);
        setFeedback({
          type: "success",
          text: "Link reset password sudah dikirim ke email anda",
        });
        navigate("/login?mode=login");
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      setFeedback({ type: "error", text: "Terjadi kesalahan, coba lagi" });
    }
  };

  const handleResendVerification = async (email) => {
    try {
      await api.post("/resend-verification", { email });
    } catch (err) {
      // Bisa log error kalau mau debug
      console.error("Resend verification failed:", err);
    } finally {
      setFeedback({ text: "", type: "" });
    }
  };

  const handleGoogleAuthLogin = async (e) => {
    e?.preventDefault?.(); // cegah submit default form

    if (!email || !password) {
      setFeedback({
        type: "error",
        text: "Isi email dan password terlebih dahulu",
      });
      return;
    }
    try {
      const res = await api.post("/login-google", {
        email,
        password,
        rememberMe,
      });
      const data = res.data;

      if (data.next) {
        // Belum aktif → arahkan ke halaman setup Google Authenticator
        navigate(data.next, {
          state: { email, rememberMe: rememberMe },
        });
      } else if (data.require_otp) {
        // Sudah aktif → arahkan ke halaman verifikasi OTP
        // step 2: user dialihkan ke halaman OTP
        navigate("/otp?type=google", {
          state: { email, rememberMe },
        });
      } else {
        // Sudah login lengkap (punya access & refresh token)
        navigate("/");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Login gagal";

      // kalau backend kasih status 403 atau pesan tertentu
      if (
        err.response?.status === 403 ||
        message.toLowerCase().includes("belum diverifikasi")
      ) {
        setFeedback({
          type: "unverified",
          text: message,
        });
      } else {
        setFeedback({
          type: "error",
          text: message,
        });
      }
    }
  };

  const isPasswordMatch =
    password && confirmPassword && password === confirmPassword;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
          {mode === "login" && "Monitoring IoT Login"}
          {mode === "register" && "Register Akun"}
          {mode === "forgot" && "Lupa Password"}
        </h2>

        {feedback.text && (
          <div className="mt-1 mb-3 text-center text-sm">
            <p
              className={
                feedback.type === "error" ? "text-red-500" : "text-green-600"
              }
            >
              {feedback.text}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama (register) */}
          {mode === "register" && (
            <input
              type="text"
              placeholder="Nama Lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          )}

          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />

          {/* Password (login & register) */}
          {(mode === "login" || mode === "register") && (
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-gray-500"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
              {/* Feedback realtime */}
              {mode === "register" && password.length > 0 && (
                <ul className="mt-2 text-xs">
                  {errors.map((err, i) => (
                    <li key={i} className="text-red-500">
                      ❌ {err}
                    </li>
                  ))}
                  {valid && (
                    <li className="text-green-600">✅ Password kuat</li>
                  )}
                </ul>
              )}
            </div>
          )}

          {/* Konfirmasi Password (register) */}
          {mode === "register" && (
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Konfirmasi Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2 text-gray-500"
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
              {/* Feedback realtime */}
              {confirmPassword && (
                <p
                  className={`mt-2 text-xs ${
                    isPasswordMatch ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {isPasswordMatch
                    ? "Password cocok ✔"
                    : "Password tidak sama "}
                </p>
              )}
            </div>
          )}

          {/* Remember Me (hanya login) */}
          {mode === "login" && (
            <div className="flex items-center justify-between text-sm mt-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="rounded"
                />
                Remember Me
              </label>

              <button
                type="button"
                className="text-blue-500 hover:underline"
                onClick={() => {
                  navigate("/login?mode=forgot");
                  setFeedback({ text: "", type: "" });
                }}
              >
                Forgot Password?
              </button>
            </div>
          )}

          {/* Tombol utama */}
          {mode === "login" ? (
            // Tombol login: buka modal pilih metode
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Login
            </button>
          ) : (
            // Tombol submit biasa untuk register / forgot
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {mode === "register" && "Daftar"}
              {mode === "forgot" && "Kirim Link Reset"}
            </button>
          )}

          {/* Modal untuk pilih metode login */}
          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <div className="bg-white rounded-2xl shadow-lg p-6 w-80 text-center">
                <h2 className="text-lg font-semibold mb-4">
                  Pilih Metode Login
                </h2>

                {/* Login pakai OTP Email */}
                <button
                  onClick={() => {
                    setShowModal(false);
                    handleSubmit();
                  }}
                  className="w-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 py-2 rounded-lg mb-3 flex items-center justify-center gap-2 transition"
                >
                  <SiGmail className="w-5 h-5" />
                  Login dengan OTP Email
                </button>

                {/* Login pakai Google Authenticator */}
                <button
                  onClick={() => {
                    setShowModal(false);
                    handleGoogleAuthLogin();
                  }}
                  className="w-full border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 py-2 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <SiGoogleauthenticator className="w-5 h-5" />
                  Login dengan Google Auth
                </button>

                <button
                  onClick={() => setShowModal(false)}
                  className="mt-4 px-4 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer: switch mode */}
        <p className="mt-6 text-center text-sm text-gray-600">
          {mode === "login" && (
            <>
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={() => navigate("/login?mode=register")}
                className="text-blue-500 hover:underline"
              >
                Register
              </button>
            </>
          )}

          {mode === "register" && (
            <>
              Sudah punya akun?{" "}
              <button
                type="button"
                onClick={() => navigate("/login?mode=login")}
                className="text-blue-500 hover:underline"
              >
                Login
              </button>
            </>
          )}

          {mode === "forgot" && (
            <>
              Kembali ke{" "}
              <button
                type="button"
                onClick={() => navigate("/login?mode=login")}
                className="text-blue-500 hover:underline"
              >
                Login
              </button>
            </>
          )}
        </p>
      </div>
      <VerificationModal
        isOpen={showVerificationModal}
        type={modalType}
        email={email}
        onClose={() => setShowVerificationModal(false)}
        onRedirect={() => navigate("/login?mode=login")}
        onResend={handleResendVerification}
      />
    </div>
  );
}
