import React, { useEffect, useState } from "react";
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  validateOldPassword, // endpoint baru untuk cek password lama
} from "../api/profile";
import { useNavigate } from "react-router-dom";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { validatePassword } from "../utils/passwordValidator";
import ConfirmModal from "../components/ConfirmModal";
import debounce from "lodash.debounce";

export default function ProfilePage({ onLogout }) {
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [message, setMessage] = useState("");
  const [oldPasswordValid, setOldPasswordValid] = useState(null);
  const { valid, errors } = validatePassword(passwordForm.newPassword);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        console.log("Data dari API:", data);
        setEditForm({ name: data.name, email: data.email });
      } catch (err) {
        console.error("Gagal ambil profil:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Debounce untuk cek password lama
  const checkOldPassword = debounce(async (value) => {
    if (!value) return setOldPasswordValid(null);
    try {
      const valid = await validateOldPassword(value);
      setOldPasswordValid(valid); // valid = true/false
    } catch (err) {
      setOldPasswordValid(false);
    }
  }, 500);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (passwordForm.oldPassword) {
        checkOldPassword(passwordForm.oldPassword);
      }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [passwordForm.oldPassword, checkOldPassword]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(editForm);
      setMessage("Profil berhasil diperbarui");
    } catch (err) {
      setMessage("Gagal update profil");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPasswordValid) {
      setMessage("Password lama salah");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage("Password baru dan konfirmasi tidak sama");
      return;
    }
    try {
      await changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        newPassword_confirmation: passwordForm.confirmPassword,
      });
      setMessage("Password berhasil diubah");
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setOldPasswordValid(null);
    } catch (err) {
      setMessage("Gagal mengubah password");
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Yakin ingin hapus akun?")) return;
    try {
      await deleteAccount();
      onLogout();
      navigate("/login");
    } catch (err) {
      setMessage("Gagal hapus akun");
    }
  };

  const passwordsMatch =
    passwordForm.newPassword &&
    passwordForm.confirmPassword &&
    passwordForm.newPassword === passwordForm.confirmPassword;

  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold mb-4 text-gray-800 text-center sm:text-left">Profil Saya</h2>

        {message && (
          <div className="p-3 bg-blue-100 text-blue-700 rounded shadow">
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-gray-500 text-center py-10">Loading...</div>
        ) : (
          <>
            {/* Update Profil */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">
                Update Profil
              </h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="Nama"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  placeholder="Email"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow transition">
                  Simpan Perubahan
                </button>
              </form>
            </div>

            {/* Ganti Password */}
            <div className="bg-white shadow-md rounded-lg p-6 relative">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">
                Ganti Password
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Password Lama */}
                <div className="relative">
                  <input
                    type={showPassword.old ? "text" : "password"}
                    value={passwordForm.oldPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        oldPassword: e.target.value,
                      })
                    }
                    placeholder="Password Lama"
                    className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                      oldPasswordValid === false
                        ? "border-red-500 focus:ring-red-400"
                        : "border-gray-300 focus:ring-blue-400"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        old: !showPassword.old,
                      })
                    }
                    className="absolute right-3 top-2 text-gray-500"
                  >
                    {showPassword.old ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                  {oldPasswordValid === false && (
                    <p className="text-red-500 text-sm mt-1">
                      Password lama salah
                    </p>
                  )}
                </div>

                {/* Password Baru */}
                <div className="relative">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Password Baru"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        new: !showPassword.new,
                      })
                    }
                    className="absolute right-3 top-2 text-gray-500"
                  >
                    {showPassword.new ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                  {/* Feedback realtime */}
                  {passwordForm.newPassword.length > 0 && (
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

                {/* Konfirmasi Password Baru */}
                <div className="relative">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Konfirmasi Password Baru"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        confirm: !showPassword.confirm,
                      })
                    }
                    className="absolute right-3 top-2 text-gray-500"
                  >
                    {showPassword.confirm ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                  {!passwordsMatch && passwordForm.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      Password baru dan konfirmasi tidak sama
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    !passwordForm.oldPassword ||
                    !passwordsMatch ||
                    oldPasswordValid === false
                  }
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow transition disabled:opacity-50"
                >
                  Ubah Password
                </button>
              </form>
            </div>

            {/* Hapus Akun */}
            <div className="bg-white shadow-md rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-red-600">
                Hapus Akun
              </h3>
              <ConfirmModal
                title="Hapus Akun"
                message="Apakah Anda yakin ingin menghapus akun Anda? Tindakan ini tidak dapat dibatalkan."
                confirmText="Ya, Hapus"
                confirmColor="bg-red-600 hover:bg-red-700"
                onConfirm={handleDeleteAccount}
                triggerButton={({ onClick }) => (
                  <button
                    onClick={onClick}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow transition"
                  >
                    Hapus Akun
                  </button>
                )}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
