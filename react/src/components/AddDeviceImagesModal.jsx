import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export default function AddDeviceImagesModal({ isOpen, onClose, onSubmit }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState("");
  const [isThumbnail, setIsThumbnail] = useState(false);

  // Cleanup preview URL saat file berubah atau modal ditutup
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > MAX_SIZE) {
      toast.error(`File "${selectedFile.name}" terlalu besar (maks 2 MB)`);
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      // reset input supaya nama file hilang
      e.target.value = null;
      return; // <- stop eksekusi di sini
    }

    // hanya dijalankan kalau file valid
    if (preview) URL.revokeObjectURL(preview);
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleClose = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setDescription("");
    setIsThumbnail(false);
    onClose();
  };

  const handleSubmit = () => {
    if (!file) {
      toast.error("Pilih gambar terlebih dahulu");
      return;
    }

    onSubmit({ file, description, isThumbnail });

    handleClose(); // reset state & tutup modal
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Tambah Gambar Device</h2>

        <div className="mb-4">
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        {preview && (
          <div className="mb-4 w-full border rounded overflow-hidden flex justify-center bg-gray-100">
            <img
              src={preview}
              alt="Preview"
              className="max-h-40 w-auto object-contain"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Deskripsi</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            checked={isThumbnail}
            onChange={(e) => setIsThumbnail(e.target.checked)}
            id="thumbnailCheckbox"
          />
          <label htmlFor="thumbnailCheckbox" className="text-sm">
            Jadikan thumbnail
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Tambah
          </button>
        </div>
      </div>
    </div>
  );
}
