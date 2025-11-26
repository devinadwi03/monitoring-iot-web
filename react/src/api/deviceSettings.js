import api from "./axios";

/* ================================
   GET semua device settings
================================ */
export const getAllDeviceSettings = async () => {
  const res = await api.get("/device-settings");
  return res.data;
};

/* ================================
   GET device settings berdasarkan device ID
   (umumnya dipakai di halaman detail/edit)
================================ */
export const getDeviceSettingsByDevice = async (deviceId) => {
  const res = await api.get(`/device-settings/device/${deviceId}`);
  return res.data;
};

/* ================================
   GET satu setting by ID
================================ */
export const getDeviceSettingById = async (id) => {
  const res = await api.get(`/device-settings/${id}`);
  return res.data;
};

/* ================================
   CREATE device setting
================================ */
export const createDeviceSetting = async (payload) => {
  const res = await api.post("/device-settings", payload);
  return res.data;
};

/* ================================
   UPDATE device setting
================================ */
export const updateDeviceSetting = async (id, payload) => {
  const res = await api.put(`/device-settings/${id}`, payload);
  return res.data;
};

/* ================================
   DELETE device setting
================================ */
export const deleteDeviceSetting = async (id) => {
  const res = await api.delete(`/device-settings/${id}`);
  return res.data;
};
