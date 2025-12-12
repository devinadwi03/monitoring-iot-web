import api from "./axios"; // instance axios kamu

// Ambil semua gambar device
export const getDeviceImages = async (deviceId) => {
  return await api.get(`/devices/${deviceId}/images`);
};

// Ambil thumbnail device
export const getDeviceThumbnail = async (deviceId) => {
  return await api.get(`/devices/${deviceId}/images/thumbnail`);
};

// Upload gambar baru (ADMIN)
export const uploadDeviceImage = async (deviceId, file, isThumbnail = false, description = "") => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("is_thumbnail", isThumbnail ? 1 : 0);
  formData.append("description", description);

  return await api.post(`/devices/${deviceId}/images`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Update gambar (ADMIN)
export const updateDeviceImage = async (imageId, data) => {
  const formData = new FormData();

  if (data.file) formData.append("image", data.file);
  if (data.is_thumbnail !== undefined)
    formData.append("is_thumbnail", data.is_thumbnail ? 1 : 0);
  if (data.description !== undefined)
    formData.append("description", data.description);

  return await api.put(`/images/${imageId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Hapus gambar (ADMIN)
export const deleteDeviceImage = async (imageId) => {
  return await api.delete(`/images/${imageId}`);
};
