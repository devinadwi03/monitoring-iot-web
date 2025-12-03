import React, { useState, useEffect } from "react";
import { createDevice } from "../api/device";
import { getDeviceTypes } from "../api/deviceType";
import { createDeviceSetting } from "../api/deviceSettings";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function AddDevicePage() {
  const [deviceName, setDeviceName] = useState("");
  const [deviceLocation, setDeviceLocation] = useState("");
  const [deviceSN, setDeviceSN] = useState("");

  const [deviceTypes, setDeviceTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");

  const [settingsSchema, setSettingsSchema] = useState([]);
  const [settingsValues, setSettingsValues] = useState({}); // dynamic values

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load device types
  useEffect(() => {
    (async () => {
      try {
        const res = await getDeviceTypes();
        setDeviceTypes(res.data || res);
      } catch (err) {
        toast.error("Gagal memuat device type");
      }
    })();
  }, []);

  // Handle selecting a type → load schema
  useEffect(() => {
    if (!selectedType) return;

    const dt = deviceTypes.find((d) => d.id === parseInt(selectedType));
    const fields = dt?.settings_schema?.fields || [];

    setSettingsSchema(fields);

    // buat default value
    const defaults = {};
    fields.forEach((f) => (defaults[f.key] = ""));
    setSettingsValues(defaults);
    setSettingsSchema(fields);
  }, [selectedType, deviceTypes]);

  const handleSettingChange = (name, value) => {
    setSettingsValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!deviceName || !deviceLocation || !selectedType) {
      toast.error("Lengkapi semua field!");
      return;
    }

    try {
      setLoading(true);

      // STEP 1: Tambah device → dapatkan ID
      const deviceRes = await createDevice({
        name: deviceName,
        location: deviceLocation,
        serial_number: deviceSN,
        device_type_id: selectedType,
      });

      const deviceId = deviceRes.data?.id || deviceRes.id;
      if (!deviceId) throw new Error("Device ID tidak ditemukan dari API");

      // STEP 2: Simpan settings tergantung schema
      for (const key in settingsValues) {
        await createDeviceSetting({
          device_id: deviceId,
          key: key, // ← ini benar
          value: settingsValues[key],
        });
      }

      toast.success("Device & settings berhasil disimpan!");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal menambahkan device");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">
          Tambah Device Baru
        </h2>

        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NAME */}
            <input
              type="text"
              placeholder="Nama Device"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />

            {/* SERIAL */}
            <input
              type="text"
              placeholder="Serial Number"
              value={deviceSN}
              onChange={(e) => setDeviceSN(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />

            {/* LOCATION */}
            <input
              type="text"
              placeholder="Lokasi Device"
              value={deviceLocation}
              onChange={(e) => setDeviceLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />

            {/* DEVICE TYPE DROPDOWN */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">-- Pilih Device Type --</option>
              {deviceTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.name}
                </option>
              ))}
            </select>

            {/* DYNAMIC SETTINGS */}
            {settingsSchema.length > 0 && (
              <div className="border rounded-md p-4 bg-gray-50 space-y-3">
                <h3 className="font-semibold text-gray-700">
                  Pengaturan Device
                </h3>

                {settingsSchema.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      value={settingsValues[field.key]}
                      onChange={(e) =>
                        handleSettingChange(field.key, e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
            >
              {loading ? "Menyimpan..." : "Tambahkan Device"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
