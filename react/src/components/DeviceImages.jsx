import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getDeviceImages,
  uploadDeviceImage,
  setDeviceImageThumbnail,
  updateDeviceImageDescription,
  deleteDeviceImage,
} from "../api/deviceImages";
import { StarIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/solid";
import ConfirmModal from "./ConfirmModal";
import AddDeviceImagesModal from "./AddDeviceImagesModal";
import EditDescriptionImagesModal from "./EditDescriptionImagesModal";

const BASE_URL = "http://localhost:8000";
// atau pakai hardcode kalau belum pakai env

export default function DeviceImages({ deviceId, role }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState(null);

  // Modal tambah gambar
  const [addOpen, setAddOpen] = useState(false);

  // Modal edit description
  const [editDescriptionId, setEditDescriptionId] = useState(null);
  const [editDescriptionText, setEditDescriptionText] = useState("");

  const loadImages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDeviceImages(deviceId);
      setImages(res.data || []);
    } catch {
      toast.error("Gagal memuat gambar device");
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    if (deviceId) loadImages();
  }, [deviceId, loadImages]);

  const setAsThumbnail = async (imageId) => {
    try {
      await setDeviceImageThumbnail(imageId);
      toast.success("Thumbnail diperbarui");
      loadImages();
    } catch {
      toast.error("Gagal set thumbnail");
    }
  };

  const confirmDelete = (imageId) => {
    setSelectedImageId(imageId);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!selectedImageId) return;

    try {
      await deleteDeviceImage(selectedImageId);
      toast.success("Gambar dihapus");
      // Ambil semua gambar terbaru, termasuk thumbnail baru
      await loadImages();
    } catch {
      toast.error("Gagal menghapus gambar");
    } finally {
      setConfirmOpen(false);
      setSelectedImageId(null);
    }
  };

  const addImage = async ({ file, description = "", isThumbnail = false }) => {
    if (!file) return toast.error("Pilih file gambar dulu");

    try {
      await uploadDeviceImage(deviceId, file, isThumbnail, description);
      toast.success("Gambar berhasil ditambahkan");
      loadImages();
      setAddOpen(false); // tutup modal
    } catch {
      toast.error("Gagal menambahkan gambar");
    }
  };

  const saveDescription = async (newText) => {
    if (!editDescriptionId) return;

    try {
      await updateDeviceImageDescription(editDescriptionId, newText);
      toast.success("Description diperbarui");
      loadImages();
    } catch {
      toast.error("Gagal memperbarui description");
    } finally {
      setEditDescriptionId(null);
      setEditDescriptionText("");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <h3 className="text-lg font-semibold mb-4">Gambar Device</h3>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* Jika kosong */}
          {images.length === 0 && (
            <p className="text-gray-500 text-sm col-span-full text-center">
              Belum ada gambar.
            </p>
          )}
          {/* Tambah Gambar */}
          {role === "admin" && (
            <div
              onClick={() => setAddOpen(true)}
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl h-32 cursor-pointer hover:bg-gray-100 transition"
            >
              <span className="text-2xl text-gray-400">+</span>
              <span className="text-xs text-gray-500 mt-1">Tambah Gambar</span>
            </div>
          )}
          {images.map((img) => (
            <div
              key={img.id}
              className={`relative border rounded-xl overflow-hidden group ${
                img.is_thumbnail === 1 ? "ring-2 ring-indigo-500" : ""
              }`}
            >
              <img
                src={`${BASE_URL}/${img.image_path}`}
                alt={img.description || "Device Image"}
                className="w-full h-32 object-cover"
              />

              {/* Badge thumbnail */}
              {img.is_thumbnail === 1 && (
                <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded">
                  Thumbnail
                </div>
              )}

              {/* Overlay admin actions */}
              {role === "admin" && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                  {img.is_thumbnail !== 1 && (
                    <button
                      onClick={() => setAsThumbnail(img.id)}
                      className="p-2 bg-yellow-400 rounded-full hover:bg-yellow-500"
                      title="Jadikan thumbnail"
                    >
                      <StarIcon className="w-5 h-5 text-white" />
                    </button>
                  )}

                  <button
                    onClick={() => confirmDelete(img.id)}
                    className="p-2 bg-red-500 rounded-full hover:bg-red-600"
                    title="Hapus gambar"
                  >
                    <TrashIcon className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => {
                      setEditDescriptionId(img.id);
                      setEditDescriptionText(img.description);
                    }}
                    className="p-2 bg-blue-500 rounded-full hover:bg-blue-600"
                  >
                    <PencilIcon className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}

              {/* Description */}
              {img.description && (
                <div className="p-2 text-xs text-gray-600 truncate">
                  {img.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doDelete}
        title="Hapus Gambar"
        message="Apakah Anda yakin ingin menghapus gambar ini?"
        confirmText="Hapus"
        cancelText="Batal"
        confirmColor="bg-red-500 hover:bg-red-600"
      />
      <AddDeviceImagesModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={addImage}
      />
      <EditDescriptionImagesModal
        isOpen={!!editDescriptionId}
        onClose={() => setEditDescriptionId(null)}
        onSave={saveDescription}
        initialText={editDescriptionText}
      />
    </div>
  );
}
