import api from "./axios";

export const getSensorData = async (deviceId) => {
  const token = localStorage.getItem("token"); // ambil token dari localStorage
  const res = await api.get(`/devices/${deviceId}/data`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
