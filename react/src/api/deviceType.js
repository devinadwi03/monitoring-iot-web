import api from "./axios";

export const getDeviceTypes = async () => {
  const res = await api.get("/api/device-types");
  return res.data;
};
