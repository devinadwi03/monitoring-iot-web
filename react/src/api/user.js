import api from "./axios"; // axios instance yang sudah ada

// Ambil semua user (khusus admin)
export const getUsers = async () => {
  const res = await api.get("/admin/users");
  return res.data;
};

// Ambil detail user by ID
export const getUserById = async (id) => {
  const res = await api.get(`/admin/users${id}`);
  return res.data;
};

// Tambah user baru (opsional, kalau admin bisa tambah manual)
export const createUser = async (userData) => {
  const res = await api.post("/admin/users", userData);
  return res.data;
};

// Update user (misal ubah nama, role, dll)
export const updateUser = async (id, userData) => {
  const res = await api.put(`/admin/users/${id}`, userData);
  return res.data;
};

// Hapus user
export const deleteUser = async (id) => {
  const res = await api.delete(`/admin/users/${id}`);
  return res.data;
};
