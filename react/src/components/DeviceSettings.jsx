// src/components/DeviceSettings.jsx
import React from "react";

export default function DeviceSettings({ settings }) {
  if (!settings || settings.length === 0) return null;

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-700">Pengaturan Device</h3>
      <div
        className="grid gap-4 text-gray-700"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {settings.map((s) => (
          <div
            key={s.id}
            className="border rounded-xl bg-gray-50 p-3 flex flex-col"
          >
            {/* LABEL */}
            <span className="text-sm text-gray-500">{s.label || s.key}</span>
            {/* VALUE */}
            <span className="text-lg font-semibold text-gray-800">
              {s.value}
              {s.unit && (
                <span className="text-sm text-gray-600 ml-1">{s.unit}</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
