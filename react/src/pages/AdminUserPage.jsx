import React, { useEffect, useState } from "react";
import { getUsers, createUser, deleteUser, updateUser } from "../api/user";
import { validatePassword } from "../utils/passwordValidator";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { SiGmail } from "react-icons/si";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function AdminUserPage({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });
  const [showForm, setShowForm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { valid, errors } = validatePassword(newUser.password);
  const [loading, setLoading] = useState(true);
  const [cooldowns, setCooldowns] = useState({}); // simpan waktu cooldown per user
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("name-asc");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      console.error("Gagal ambil user:", err);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    if (passwordError) return; // cegah submit kalau password error
    try {
      await createUser({
        ...newUser,
        password_confirmation: confirmPassword, // 👈 tambahkan ini
      });
      setNewUser({ name: "", email: "", password: "", role: "admin" });
      setConfirmPassword("");
      setShowForm(false);
      fetchUsers();
      toast.success("Admin baru berhasil ditambahkan");
    } catch (err) {
      console.error("Gagal tambah admin:", err);
      toast.error(err.response?.data?.message || "Gagal menambah admin");
    }
  }

  async function handleDeleteUser(id) {
    try {
      if (id === currentUser.id) {
        alert("❌ Tidak bisa menghapus akun sendiri!");
        return;
      }

      // panggil API hapus user
      await deleteUser(id);

      // refresh daftar user
      await fetchUsers();

      // optional: tampilkan notifikasi sukses
      toast.success(" Pengguna berhasil dihapus");
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Gagal menghapus pengguna. Coba lagi."
      );
    }
  }

  async function handleRoleChange(id, newRole) {
    if (id === currentUser.id) {
      alert("Tidak bisa ubah role akun sendiri!");
      return;
    }
    try {
      await updateUser(id, { role: newRole });
      fetchUsers();
      toast.success(" Berhasil mengubah role pengguna");
    } catch (err) {
      console.error("Gagal ubah role:", err);
      toast.error(
        err.response?.data?.message || "Gagal mengubah role. Coba lagi."
      );
    }
  }
  const handleResendVerification = async (id) => {
    // Cek apakah masih cooldown
    const now = Date.now();
    if (cooldowns[id] && now - cooldowns[id] < 3 * 60 * 1000) {
      const remaining = Math.ceil(
        (3 * 60 * 1000 - (now - cooldowns[id])) / 1000
      );
      toast.error(
        `Tunggu ${Math.floor(remaining / 60)}:${(remaining % 60)
          .toString()
          .padStart(2, "0")} sebelum kirim ulang`
      );
      return;
    }

    try {
      await api.post(`/admin/users/${id}/resend-verification`);
      toast.success("Email verifikasi telah dikirim ulang");
      setCooldowns((prev) => ({ ...prev, [id]: Date.now() }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengirim email");
    }
  };

  const getCooldownText = (id) => {
    const now = Date.now();
    const sentAt = cooldowns[id];
    if (!sentAt) return "";
    const remainingMs = 3 * 60 * 1000 - (now - sentAt);
    if (remainingMs <= 0) return "";
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    return `(${minutes}:${seconds.toString().padStart(2, "0")})`;
  };

  // cek kesamaan password setiap kali ada perubahan
  useEffect(() => {
    if (confirmPassword.length > 0) {
      if (confirmPassword !== newUser.password) {
        setPasswordError("Konfirmasi password tidak cocok");
      } else {
        setPasswordError(""); // kosongkan jika cocok
      }
    } else {
      setPasswordError(""); // hilangkan error saat belum diisi
    }
  }, [confirmPassword, newUser.password]);

  // 🔍 Filter user berdasarkan nama atau email
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ↕️ Urutkan user sesuai pilihan dropdown
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortOption) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "role-asc":
        return a.role.localeCompare(b.role);
      case "role-desc":
        return b.role.localeCompare(a.role);
      case "verified":
        return (b.email_verified_at ? 1 : 0) - (a.email_verified_at ? 1 : 0);
      default:
        return 0;
    }
  });

  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold mb-4 text-gray-800 text-center sm:text-left">
          Manajemen User
        </h2>

        {/* Form Tambah Admin */}
        {showForm ? (
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">
              Tambah Admin
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <input
                type="text"
                placeholder="Nama"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              {/* Password */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              </div>

              {/* Feedback realtime */}
              {newUser.password.length > 0 && (
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
              {/* Konfirmasi Password */}
              <div className="relative mt-3">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Konfirmasi Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              </div>
              {/* Feedback realtime */}
              {passwordError && (
                <p className="text-red-500 text-xs mt-1">{passwordError}</p>
              )}
              {!passwordError && confirmPassword.length > 0 && (
                <p className="text-green-600 text-xs mt-1">✅ Password cocok</p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={!!passwordError}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow transition disabled:opacity-50"
                >
                  Tambah Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setNewUser({
                      name: "",
                      email: "",
                      password: "",
                      role: "admin",
                    });
                    setConfirmPassword("");
                  }}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-md shadow transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow transition"
          >
            Tambah Admin
          </button>
        )}

        {loading ? (
          <div className="text-center text-gray-500 py-20 text-lg">
            Loading...
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-xl overflow-hidden">
            {/* 🔍 Search & Sort Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 bg-gray-50 border-b gap-3">
              {/* Search */}
              <input
                type="text"
                placeholder="Cari user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

              {/* Sort */}
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="name-asc">Nama (A–Z)</option>
                <option value="name-desc">Nama (Z–A)</option>
                <option value="role-asc">Role (A–Z)</option>
                <option value="role-desc">Role (Z–A)</option>
                <option value="verified">Status Verifikasi</option>
              </select>
            </div>
            <div className="w-full overflow-x-auto">
              <table className="min-w-[800px] w-full border-collapse">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Nama
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="p-4 text-center text-sm font-semibold text-gray-700">
                      Verifikasi
                    </th>
                    <th className="p-4 text-center text-sm font-semibold text-gray-700">
                      Role
                    </th>
                    <th className="p-4 text-center text-sm font-semibold text-gray-700">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center text-gray-500 py-6 italic"
                      >
                        Tidak ada user yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    sortedUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-4 text-gray-800">{u.name}</td>
                        <td className="p-4 text-gray-600">{u.email}</td>

                        {/* Status Verifikasi */}
                        <td className="p-4 text-center">
                          {u.email_verified_at ? (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Terverifikasi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-medium">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              Belum
                            </span>
                          )}
                        </td>

                        {/* Role */}
                        <td className="p-4 text-center">
                          <select
                            value={u.role}
                            disabled={u.id === currentUser.id}
                            onChange={(e) =>
                              handleRoleChange(u.id, e.target.value)
                            }
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>

                        {/* Tombol Aksi */}
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-3">
                            {/* Kirim Ulang Email */}
                            <button
                              onClick={() => handleResendVerification(u.id)}
                              disabled={u.email_verified_at}
                              className={`flex items-center gap-1 justify-center px-3 py-1 rounded-md text-xs font-medium transition ${
                                u.email_verified_at
                                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                  : "bg-blue-500 text-white hover:bg-blue-600"
                              }`}
                            >
                              <SiGmail className="w-3 h-3" />
                              {getCooldownText(u.id) ? (
                                <span>{getCooldownText(u.id)}</span>
                              ) : (
                                <span>Kirim Ulang</span>
                              )}
                            </button>

                            {/* Hapus */}
                            <ConfirmModal
                              title="Hapus Pengguna"
                              message={`Apakah Anda yakin ingin menghapus akun ${u.name}? Tindakan ini tidak dapat dibatalkan.`}
                              confirmText="Ya, Hapus"
                              confirmColor="bg-red-500 hover:bg-red-600"
                              onConfirm={() => handleDeleteUser(u.id)}
                              triggerButton={({ onClick }) => (
                                <button
                                  onClick={onClick}
                                  disabled={u.id === currentUser.id}
                                  className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                                    u.id === currentUser.id
                                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                      : "bg-red-500 text-white hover:bg-red-600"
                                  }`}
                                >
                                  Hapus
                                </button>
                              )}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
