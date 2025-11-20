import React, { useState } from "react";
import { createDevice } from "../api/device";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function AddDevicePage() {
  const [deviceName, setDeviceName] = useState("");
  const [deviceLocation, setDeviceLocation] = useState("");
  const [deviceSN, setDeviceSN] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!deviceName || !deviceLocation) {
      toast.error("Lengkapi semua field!");
      return;
    }

    try {
      setLoading(true);
      await createDevice({
        name: deviceName,
        location: deviceLocation,
        serial_number: deviceSN,
      });
      toast.success("Device berhasil ditambahkan!");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Gagal menambahkan device. Coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold mb-4 text-gray-800 text-center sm:text-left">Tambah Device Baru</h2>

        {loading ? (
          <div className="text-gray-500 text-center py-10">Loading...</div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Nama Device"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              <input
                type="text"
                placeholder="Serial Number (Opsional)"
                value={deviceSN}
                onChange={(e) => setDeviceSN(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              <input
                type="text"
                placeholder="Lokasi Device"
                value={deviceLocation}
                onChange={(e) => setDeviceLocation(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Tambahkan Device"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
