// src/components/DeviceSettings.jsx
import React from "react";

export default function DeviceSettings({ settings }) {
  if (!settings || settings.length === 0) return null;

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-700">Pengaturan Device</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-gray-700">
        {settings.map((s) => (
          <div key={s.id} className="border p-2 rounded-lg bg-gray-50">
            <span className="font-semibold">{s.key}:</span> {s.value}
          </div>
        ))}
      </div>
    </div>
  );
}
