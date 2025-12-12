import React, { useState, useEffect } from "react";
import {
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { ClipboardIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import EditSettingsModal from "./EditSettingsModal";
import { getDeviceTypes } from "../api/deviceType";
import toast from "react-hot-toast";

export default function DeviceCard({
  id,
  name,
  serial_number,
  location,
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
          <div onClick={onClick} className="space-y-1 overflow-hidden">
            <h2 className="text-lg font-bold text-indigo-600 truncate">
              {name}
            </h2>
            <p className="text-gray-500 text-sm truncate">
              SN: {serial_number}
            </p>
            <p className="text-gray-500 text-sm truncate">{location}</p>

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
                  <span className="font-semibold text-gray-700">
                    Created at:
                  </span>{" "}
                  {created_at
                    ? new Date(created_at).toLocaleString("id-ID")
                    : "-"}
                </p>
                <p>
                  <span className="font-semibold text-gray-700">
                    Updated at:
                  </span>{" "}
                  {updated_at
                    ? new Date(updated_at).toLocaleString("id-ID")
                    : "-"}
                </p>
              </div>
            )}
          </div>

          {/* Tombol aksi */}
          <div className="absolute top-3 right-3 flex gap-2">
            {role === "admin" && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="p-2 rounded-full bg-yellow-100 hover:bg-yellow-200 transition"
                >
                  <PencilIcon className="h-5 w-5 text-yellow-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition"
                >
                  <TrashIcon className="h-5 w-5 text-red-600" />
                </button>
              </>
            )}
            {/* Tombol Edit Settings */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
              className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition"
              title="Edit Settings"
            >
              ⚙️
            </button>
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
