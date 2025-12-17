// src/components/DeviceInfo.jsx
import React from "react";

export default function DeviceInfo({ device, deviceType, role }) {
  if (!device) return null;

  return (
    <div className="bg-white shadow rounded-xl overflow-hidden">
      {/* HEADER CARD */}
      <div className="px-6 py-4 border-b">
        <h2 className="text-2xl font-bold text-indigo-600 mb-1">
          {device.name}
        </h2>
        <p className="text-sm text-gray-500">Informasi dasar perangkat</p>
      </div>

      {/* Content */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 text-sm">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
          <span className="text-gray-500">Serial Number:</span>
          <span className="font-medium text-gray-800">
            {device.serial_number}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
          <span className="text-gray-500">Lokasi:</span>
          <span className="font-medium text-gray-800">{device.location}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
          <span className="text-gray-500">Tipe Device:</span>
          <span className="font-medium text-gray-800">
            {deviceType?.name ?? "-"}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
          <span className="text-gray-500">Tanggal Dibuat:</span>
          <span className="font-medium text-gray-800">
            {" "}
            {device.created_at
              ? new Date(device.created_at).toLocaleString("id-ID")
              : "-"}
          </span>
        </div>
        {role === "admin" && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
            <span className="text-gray-500">Terakhir Update:</span>
            <span className="font-medium text-gray-800">
              {device.updated_at
                ? new Date(device.updated_at).toLocaleString("id-ID")
                : "-"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
