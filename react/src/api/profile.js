import api from "./axios";

// Ambil profil user login
export const getProfile = async () => {
  const res = await api.get("/me");
  return res.data;
};

// Update profil user
export const updateProfile = async (profileData) => {
  const res = await api.put("/user", profileData);
  return res.data;
};

// Hapus akun sendiri
export const deleteAccount = async () => {
  const res = await api.delete("/user");
  return res.data.valid;
};

export async function validateOldPassword(oldPassword) {
  const res = await api.post("validate-password", { oldPassword });
  return res.data.valid; // { valid: true/false }
}

export async function changePassword(data) {
  const res = await api.post("/change-password", data);
  return res.data;
}
