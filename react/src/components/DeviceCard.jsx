import React, { useState, useEffect } from "react";
import {
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import {
  ClipboardIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import EditSettingsModal from "./EditSettingsModal";
import { getDeviceTypes } from "../api/deviceType";
import { getDeviceThumbnail } from "../api/deviceImages";
import toast from "react-hot-toast";

export default function DeviceCard({
  id,
  name,
  serial_number,
  location,
  deviceTypeName,
  api_key,
  created_at,
  updated_at,
  device_type_id,
  role,
  onClick,
  onEdit,
  onDelete,
  onRegenerate,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [editSerial, setEditSerial] = useState(serial_number);
  const [editLocation, setEditLocation] = useState(location);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [editTypeId, setEditTypeId] = useState("");
  const [thumbnail, setThumbnail] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);

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

  // sync state dengan props ketika masuk mode edit
  useEffect(() => {
    if (isEditing) {
      setEditName(name);
      setEditSerial(serial_number);
      setEditLocation(location);
      setEditTypeId(device_type_id);
    }
  }, [isEditing, name, serial_number, location, device_type_id]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getDeviceThumbnail(id);

        // backend harus return path atau object
        const thumbPath = res.data?.image_url || null;

        setThumbnail(thumbPath);
      } catch (err) {
        console.error("Gagal load thumbnail:", err);
      }
    })();
  }, [id]);

  const handleSave = () => {
    onEdit(id, {
      name: editName,
      serial_number: editSerial,
      location: editLocation,
      device_type_id: editTypeId,
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white shadow-md rounded-2xl p-4 relative transition-transform transform hover:scale-105 hover:shadow-xl cursor-pointer break-words">
      {!isEditing ? (
        <>
          <div
            onClick={onClick}
            className={`overflow-hidden flex gap-4 items-start ${
              role !== "admin" ? "items-center" : ""
            }`}
          >
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt="Thumbnail"
                  className="w-28 h-28 object-cover rounded-xl border"
                />
              ) : (
                <div className="w-28 h-28 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-400 border">
                  No Image
                </div>
              )}

              {/* TOMBOL AKSI */}
              {role === "admin" && (
                <>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                      className="p-2 rounded-full bg-yellow-100 hover:bg-yellow-200"
                    >
                      <PencilIcon className="h-4 w-4 text-yellow-600" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="p-2 rounded-full bg-red-100 hover:bg-red-200"
                    >
                      <TrashIcon className="h-4 w-4 text-red-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalOpen(true);
                      }}
                      className="p-2 rounded-full bg-blue-100 hover:bg-blue-200"
                      title="Edit Settings"
                    >
                      <Cog6ToothIcon className="w-5 h-5 text-blue-600" />
                    </button>
                  </div>
                </>
              )}

              {role !== "admin" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalOpen(true);
                  }}
                  className="absolute top-4 sm:top-3 right-3 p-2 rounded-full bg-blue-100 hover:bg-blue-200"
                  title="Edit Settings"
                >
                  <Cog6ToothIcon className="w-5 h-5 text-blue-600" />
                </button>
              )}
            </div>

            <div
              className={`flex-1 min-w-0 space-y-1 overflow-hidden ${
                role !== "admin" ? "pr-12" : ""
              }`}
            >
              <h2 className="text-lg font-bold text-indigo-600 truncate">
                {name}
              </h2>
              <p className="text-gray-500 text-sm truncate">
                SN: {serial_number}
              </p>
              <p className="text-gray-500 text-sm truncate">{location}</p>
              <p className="text-gray-500 text-sm truncate">
                <span className="font-bold">Tipe:</span>{" "}
                {deviceTypeName || "-"}
              </p>

              {/* Field tambahan khusus untuk admin */}
              {role === "admin" && (
                <div className="mt-3 border-t border-gray-200 pt-2 space-y-1 text-xs text-gray-600 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate flex-1">
                      <span className="font-semibold text-gray-700">
                        API Key:
                      </span>{" "}
                      <span className="break-all">{api_key || "-"}</span>
                    </p>

                    {/* Tombol aksi di samping API key */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Tombol salin API Key */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (api_key) {
                            navigator.clipboard.writeText(api_key);
                            toast.success("API Key disalin!");
                          } else {
                            toast.error("Tidak ada API Key untuk disalin");
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800 transition"
                        title="Salin API Key"
                      >
                        <ClipboardIcon className="w-4 h-4 inline-block" />
                      </button>
                      {/* Tombol regenerate */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRegenerate?.();
                        }}
                        className="text-yellow-600 hover:text-yellow-800 transition"
                        title="Generate ulang API Key"
                      >
                        <ArrowPathIcon className="w-4 h-4 inline-block" />
                      </button>
                    </div>
                  </div>

                  <p>
                    <span className="font-semibold text-gray-700">Dibuat:</span>{" "}
                    {created_at
                      ? new Date(created_at).toLocaleString("id-ID")
                      : "-"}
                  </p>
                  <p className="truncate flex-1">
                    <span className="font-semibold text-gray-700">
                      Terakhir Update:
                    </span>{" "}
                    {updated_at
                      ? new Date(updated_at).toLocaleString("id-ID")
                      : "-"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        // Mode edit
        <div className="space-y-2">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Nama Device"
          />
          <input
            type="text"
            value={editSerial}
            onChange={(e) => setEditSerial(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Serial Number"
          />
          <input
            type="text"
            value={editLocation}
            onChange={(e) => setEditLocation(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Lokasi"
          />
          <select
            value={editTypeId}
            onChange={(e) => setEditTypeId(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">-- Pilih Device Type --</option>
            {deviceTypes.map((dt) => (
              <option key={dt.id} value={dt.id}>
                {dt.name}
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-2 mt-1">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg transition"
            >
              <CheckIcon className="h-4 w-4" /> Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded-lg transition"
            >
              <XMarkIcon className="h-4 w-4" /> Cancel
            </button>
          </div>
        </div>
      )}
      {/* Modal */}
      {modalOpen && (
        <EditSettingsModal
          deviceId={id}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          role={role}
        />
      )}
    </div>
  );
}
