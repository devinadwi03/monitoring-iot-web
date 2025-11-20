import api from "./axios";

export async function getDevices() {
  try {
    const response = await api.get("/devices"); // pakai api, bukan axios
    return response.data;
  } catch (error) {
    console.error("Gagal ambil devices:", error);
    throw error;
  }
}

export const createDevice = async (deviceData) => {
  const res = await api.post("/devices", deviceData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.data;
};

// Update device
export const updateDevice = async (id, device) => {
  const res = await api.put(`/devices/${id}`, device);
  return res.data;
};

// Hapus device
export const deleteDevice = async (id) => {
  const res = await api.delete(`/devices/${id}`);
  return res.data;
};

// Regenerate API Key (hanya admin)
export const regenerateApiKey = async (id) => {
  try {
    const res = await api.post(`/devices/${id}/regenerate-key`);
    return res.data;
  } catch (error) {
    console.error("Gagal regenerate API key:", error);
    throw error;
  }
};
