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

// Update File
export const updateDeviceImageFile = async (imageId, file) => {
  const formData = new FormData();
  formData.append("image", file);

  return api.post(`/images/${imageId}/file`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Update Thumbnail
export const setDeviceImageThumbnail = async (imageId) => {
  return api.patch(`/images/${imageId}/thumbnail`);
};

// Update ImageDescription
export const updateDeviceImageDescription = async (imageId, description) => {
  return api.patch(`/images/${imageId}`, { description });
};

// Hapus gambar (ADMIN)
export const deleteDeviceImage = async (imageId) => {
  return await api.delete(`/images/${imageId}`);
};
