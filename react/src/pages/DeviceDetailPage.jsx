import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DeviceInfo from "../components/DeviceInfo";
import DeviceSettings from "../components/DeviceSettings";
import DeviceImages from "../components/DeviceImages";

// Dashboard each Device
import TorenDashboard from "./Devices/MonitoringToren/TorenDashboard";

// API
import { getDevice } from "../api/device";
import { getMe } from "../api/auth"; // ambil data dari /me
import { getDeviceTypeById } from "../api/deviceType";
import { getDeviceSettings } from "../api/deviceSettings";

export default function DeviceDetailPage() {
  const { deviceId } = useParams();

  const [device, setDevice] = useState(null);
  const [deviceType, setDeviceType] = useState(null);
  const [settings, setSettings] = useState([]);

  const [role, setRole] = useState("");

  // 1️⃣ Ambil device
  useEffect(() => {
    if (!deviceId) return;

    const loadDevice = async () => {
      try {
        const dev = await getDevice(deviceId);
        setDevice(dev);

        // Ambil deviceType via API khusus
        if (dev.device_type_id) {
          const dt = await getDeviceTypeById(dev.device_type_id);
          setDeviceType(dt);
        } else {
          setDeviceType(null);
        }

        // Load settings
        const resSettings = await getDeviceSettings(deviceId);
        setSettings(resSettings.data || resSettings || []);
      } catch (err) {
        console.error("Gagal load device/type:", err);
      }
    };

    loadDevice();
  }, [deviceId]);

  // 🔹 Load role user
  useEffect(() => {
    getMe()
      .then((res) => setRole(res.role))
      .catch((err) => console.error("Gagal ambil role:", err));
  }, []);

  // 📌 Kalau device belum ada, tampilkan placeholder sederhana
  // sebelum switch
  if (!device || !deviceType) {
    return <div className="text-gray-500 text-center py-10">Loading...</div>;
  }

  // 🔥 Render berdasar type device
  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* HEADER PAGE */}
        <div>
          <h2 className="text-3xl font-bold mb-4 text-gray-800 text-center sm:text-left">Detail Device</h2>
          <p className="text-gray-500 text-sm text-center sm:text-left">
            Informasi lengkap perangkat dan pengaturannya
          </p>
        </div>
        {/* INFO & SETTINGS GLOBAL */}
        <DeviceInfo device={device} deviceType={deviceType} role={role} />
        <DeviceSettings settings={settings} />

        {/* 🔹 GALERI GAMBAR DEVICE */}
        <DeviceImages deviceId={deviceId} role={role} />

        {/* SWITCH untuk tipe device */}
        {(() => {
          switch (deviceType.name) {
            case "Monitoring Toren":
              return <TorenDashboard device={device} role={role} />;
            default:
              return <p>Type belum memiliki tampilan khusus.</p>;
          }
        })()}
      </div>
    </div>
  );
}
