// src/components/DeviceInfo.jsx
import React, { useEffect, useState } from "react";
import { updateDevice } from "../api/device";
import toast from "react-hot-toast";

export default function DeviceInfo({ device, deviceType, role }) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(device?.description || "");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setDescription(device?.description || "");
  }, [device]);

  const handleSaveDescription = async () => {
    if (description.length > 2000) {
      toast.error("Deskripsi maksimal 2000 karakter");
      return;
    }

    try {
      setLoading(true);

      await updateDevice(device.id, {
        description,
      });

      toast.success("Deskripsi berhasil disimpan");
      setIsEditing(false);

      // OPTIONAL: refresh data device dari parent
      // atau mutate local device.description
      device.description = description;
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan deskripsi");
    } finally {
      setLoading(false);
    }
  };

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
      {/* DESCRIPTION SECTION */}
      <div className="px-6 py-3 pb-6 border-t">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-gray-700">
            Deskripsi Perangkat
          </h3>

          {role === "admin" && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-indigo-600 hover:underline"
            >
              {device.description ? "Edit" : "Tambah"}
            </button>
          )}
        </div>

        {/* VIEW MODE */}
        {!isEditing && (
          <p className="text-sm text-gray-600 whitespace-pre-line">
            {device.description || (
              <span className="italic text-gray-400">
                Belum ada deskripsi perangkat
              </span>
            )}
          </p>
        )}

        {/* EDIT MODE (ADMIN ONLY) */}
        {isEditing && role === "admin" && (
          <div className="space-y-2">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full border border-gray-300 rounded-md px-3 py-2 resize-none"
              maxLength={2000}
            />

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">
                {description.length}/2000
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setDescription(device.description || "");
                    setIsEditing(false);
                  }}
                  className="px-3 py-1 text-sm border rounded-md"
                >
                  Batal
                </button>

                <button
                  onClick={handleSaveDescription}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
