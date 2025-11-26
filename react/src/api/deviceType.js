import api from "./axios";

// GET semua device type
export const getDeviceTypes = async () => {
  const res = await api.get("/device-types");
  return res.data;
};

// GET detail device type (by id)
export const getDeviceTypeById = async (id) => {
  const res = await api.get(`/device-types/${id}`);
  return res.data;
};

// CREATE device type
export const createDeviceType = async (payload) => {
  const res = await api.post("/device-types", payload);
  return res.data;
};

// UPDATE device type
export const updateDeviceType = async (id, payload) => {
  const res = await api.put(`/device-types/${id}`, payload);
  return res.data;
};

// DELETE device type
export const deleteDeviceType = async (id) => {
  const res = await api.delete(`/device-types/${id}`);
  return res.data;
};
