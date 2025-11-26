import api from "./axios";

/* ================================
   GET semua device settings
   atau berdasarkan device ID
================================ */
export const getDeviceSettings = async (deviceId) => {
  const res = await api.get("/device-settings", {
    params: deviceId ? { device_id: deviceId } : {},
  });
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
