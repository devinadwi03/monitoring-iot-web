// src/components/DeviceInfo.jsx
import React from "react";

export default function DeviceInfo({ device, deviceType }) {
  if (!device) return null;

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 space-y-4">
      <h2 className="text-2xl font-bold text-indigo-600">{device.name}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
        <div>
          <span className="font-semibold">Serial Number:</span> {device.serial_number}
        </div>
        <div>
          <span className="font-semibold">Lokasi:</span> {device.location}
        </div>
        <div>
          <span className="font-semibold">Tipe Device:</span> {deviceType?.name ?? "-"}
        </div>
        <div>
          <span className="font-semibold">Created at:</span>{" "}
          {device.created_at
            ? new Date(device.created_at).toLocaleString("id-ID")
            : "-"}
        </div>
        <div>
          <span className="font-semibold">Updated at:</span>{" "}
          {device.updated_at
            ? new Date(device.updated_at).toLocaleString("id-ID")
            : "-"}
        </div>
      </div>
    </div>
  );
}
