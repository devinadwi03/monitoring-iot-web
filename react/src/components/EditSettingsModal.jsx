import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import toast from "react-hot-toast";
import {
  updateDeviceSetting,
  getDeviceSettings,
  deleteDeviceSetting,
} from "../api/deviceSettings";

export default function EditSettingsModal({ deviceId, isOpen, onClose, role }) {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(false);

  const [originalSettings, setOriginalSettings] = useState([]);

  // Load settings device
  useEffect(() => {
    if (!isOpen || !deviceId) return;
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await getDeviceSettings(deviceId);
        setSettings(res.data || res || []);
        setOriginalSettings(res.data || res || []);
      } catch {
        toast.error("Gagal memuat settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [deviceId, isOpen]);

  const handleChange = (index, value) => {
    const updated = [...settings];
    updated[index].value = value;
    setSettings(updated);
  };

  // ⬇️ TAMBAHKAN INI
  const handleDelete = (id) => {
    setSettings((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // Ambil ID yang masih ada (setelah delete di UI)
      const currentIds = settings.map((s) => s.id);

      // Hapus ID yang tidak ada lagi
      await Promise.all(
        originalSettings
          .filter((s) => !currentIds.includes(s.id))
          .map((s) => deleteDeviceSetting(s.id))
      );

      // Update yang tersisa
      for (const s of settings) {
        await updateDeviceSetting(s.id, { key: s.key, value: s.value });
      }

      toast.success("Settings berhasil diperbarui");
      onClose();
    } catch {
      toast.error("Gagal menyimpan settings");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto shadow-lg animate-fadeIn">
        {/* Modal header */}
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            Settings Device
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          ></button>
        </div>

        {loading ? (
          <div className="text-gray-500 text-center py-10">Loading...</div>
        ) : settings.length === 0 ? (
          <p className="text-gray-500 text-sm text-center">
            Tidak ada settings untuk device ini.
          </p>
        ) : (
          <div className="space-y-3">
            {settings.map((s, idx) => (
              <div key={s.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <label className="block text-sm mb-1">{s.key}</label>

                  <input
                    type="text"
                    value={s.value || ""}
                    onChange={(e) =>
                      role === "admin" && handleChange(idx, e.target.value)
                    }
                    className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                      role !== "admin" ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                    disabled={role !== "admin"} // 💡 USER bisa lihat tapi tidak bisa edit
                  />
                </div>

                {/* Tombol hapus hanya untuk admin */}
                {role === "admin" && (
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-red-500 hover:text-red-700 mt-6"
                    title="Hapus setting"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex items-center gap-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded-lg transition"
          >
            Tutup
          </button>

          {/* Tombol Simpan hanya admin */}
          {role === "admin" && (
            <button
              onClick={handleSave}
              disabled={loading || settings.length === 0}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg transition"
            >
              Simpan
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
