import React, { useState, useEffect } from "react";
import { createDevice } from "../api/device";
import { getDeviceTypes } from "../api/deviceType";
import { createDeviceSetting } from "../api/deviceSettings";
import { uploadDeviceImage } from "../api/deviceImages";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function AddDevicePage() {
  const [deviceName, setDeviceName] = useState("");
  const [deviceLocation, setDeviceLocation] = useState("");
  const [deviceSN, setDeviceSN] = useState("");
  const [deviceDescription, setDeviceDescription] = useState("");

  const [deviceTypes, setDeviceTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");

  const [settingsSchema, setSettingsSchema] = useState([]);
  const [settingsValues, setSettingsValues] = useState({}); // dynamic values

  // images = [{ file, preview, description }] multiple
  const [images, setImages] = useState([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(null);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load device types
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

  // Handle selecting a type → load schema
  useEffect(() => {
    if (!selectedType) return;

    const dt = deviceTypes.find((d) => d.id === parseInt(selectedType));
    const fields = dt?.settings_schema?.fields || [];

    setSettingsSchema(fields);

    // buat default value
    const defaults = {};
    fields.forEach((f) => (defaults[f.key] = ""));
    setSettingsValues(defaults);
    setSettingsSchema(fields);
  }, [selectedType, deviceTypes]);

  const handleSettingChange = (name, value) => {
    setSettingsValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    const validFiles = [];
    const rejectedFiles = [];

    files.forEach((file) => {
      if (file.size > MAX_SIZE) {
        rejectedFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (rejectedFiles.length > 0) {
      toast.error(
        `File terlalu besar (maks 2 MB): ${rejectedFiles.join(", ")}`,
        { duration: 4000 }
      );
      e.target.value = "";
    }

    if (validFiles.length === 0) return;

    const newImages = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      description: "",
    }));

    setImages((prev) => {
      const updated = [...prev, ...newImages];

      // thumbnail otomatis hanya saat sebelumnya belum ada gambar
      if (prev.length === 0 && updated.length > 0) {
        setThumbnailIndex(0);
      }

      return updated;
    });

    // reset input biar bisa upload ulang file yg sama
    e.target.value = "";
  };

  const handleDescriptionChange = (index, value) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, description: value } : img))
    );
  };
  const handleRemoveImage = (index) => {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);

      // ✅ JIKA THUMBNAIL DIHAPUS
      if (thumbnailIndex === index) {
        if (updated.length > 0) {
          setThumbnailIndex(0); // pindah ke gambar pertama
        } else {
          setThumbnailIndex(null);
        }
      }
      // geser index thumbnail jika perlu
      else if (thumbnailIndex > index) {
        setThumbnailIndex(thumbnailIndex - 1);
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!deviceName || !deviceLocation || !selectedType) {
      toast.error("Lengkapi semua field!");
      return;
    }

    // VALIDASI PANJANG DESKRIPSI
    if (deviceDescription.length > 2000) {
      toast.error("Deskripsi maksimal 2000 karakter");
      return;
    }

    try {
      setLoading(true);

      // STEP 1: Tambah device → dapatkan ID
      const deviceRes = await createDevice({
        name: deviceName,
        location: deviceLocation,
        description: deviceDescription,
        serial_number: deviceSN,
        device_type_id: selectedType,
      });

      const deviceId = deviceRes.data?.id || deviceRes.id;
      if (!deviceId) throw new Error("Device ID tidak ditemukan dari API");

      // STEP 2: Simpan settings tergantung schema
      for (const key in settingsValues) {
        await createDeviceSetting({
          device_id: deviceId,
          key: key, // ← ini benar
          value: settingsValues[key],
        });
      }

      // STEP 3: Upload gambar
      if (images.length > 0) {
        // 🔴 VALIDASI WAJIB ADA THUMBNAIL
        if (thumbnailIndex === null) {
          toast.error("Harus ada satu gambar sebagai thumbnail");
          return;
        }

        for (let i = 0; i < images.length; i++) {
          await uploadDeviceImage(
            deviceId,
            images[i].file,
            thumbnailIndex === i,
            images[i].description
          );
        }
      }

      toast.success("Device berhasil ditambahkan");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gagal menambahkan device");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold mb-4 text-gray-800 text-center sm:text-left">
          Tambah Device Baru
        </h2>

        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NAME */}
            <input
              type="text"
              placeholder="Nama Device"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />

            {/* SERIAL */}
            <input
              type="text"
              placeholder="Serial Number"
              value={deviceSN}
              onChange={(e) => setDeviceSN(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />

            {/* LOCATION */}
            <input
              type="text"
              placeholder="Lokasi Device"
              value={deviceLocation}
              onChange={(e) => setDeviceLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />

            {/* DESCRIPTION */}
            <div className="relative">
              <textarea
                placeholder="Keterangan / deskripsi device (opsional)"
                value={deviceDescription}
                onChange={(e) => setDeviceDescription(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 pr-16 resize-none"
              />

              <span className="absolute bottom-2 right-1 text-xs p-2 text-gray-400">
                {deviceDescription.length}/2000
              </span>
            </div>

            {/* IMAGE UPLOAD */}
            <div className="bg-white p-4 shadow rounded-md">
              <h3 className="font-semibold mb-2">Upload Gambar Device</h3>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="block w-full text-sm text-gray-600
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />

              {/* Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-3">
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className={`border p-3 rounded-lg relative bg-white ${
                        thumbnailIndex === index ? "ring-2 ring-blue-500" : ""
                      }`}
                    >
                      {/* DELETE BUTTON */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs shadow hover:bg-red-600"
                      >
                        ✕
                      </button>

                      {/* PREVIEW GAMBAR */}
                      <div className="w-full aspect-[4/3] bg-gray-100 rounded-md overflow-hidden">
                        <img
                          src={img.preview}
                          alt={`Preview-${index}`}
                          className="w-full h-32 sm:h-40 object-cover rounded-md"
                        />
                      </div>

                      {/* INPUT DESCRIPTION */}
                      <input
                        type="text"
                        placeholder="Keterangan gambar..."
                        value={img.description}
                        onChange={(e) =>
                          handleDescriptionChange(index, e.target.value)
                        }
                        className="w-full mt-3 px-3 py-2 border text-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />

                      {/* THUMBNAIL BUTTON */}
                      <button
                        type="button"
                        onClick={() => setThumbnailIndex(index)}
                        className={`mt-2 w-full text-sm py-1 rounded ${
                          thumbnailIndex === index
                            ? "bg-green-600 text-white"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        {thumbnailIndex === index
                          ? "Thumbnail"
                          : "Jadikan Thumbnail"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DEVICE TYPE DROPDOWN */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="">-- Pilih Device Type --</option>
              {deviceTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.name}
                </option>
              ))}
            </select>

            {/* DYNAMIC SETTINGS */}
            {settingsSchema.length > 0 && (
              <div className="border rounded-md p-4 bg-gray-50 space-y-3">
                <h3 className="font-semibold text-gray-700">
                  Pengaturan Device
                </h3>

                {settingsSchema.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm mb-1">
                      {field.label}
                      {field.unit && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({field.unit})
                        </span>
                      )}
                    </label>

                    <div className="relative">
                      <input
                        type={field.type}
                        value={settingsValues[field.key] ?? ""}
                        onChange={(e) =>
                          handleSettingChange(field.key, e.target.value)
                        }
                        className={`w-full border border-gray-300 rounded-md px-3 py-2 ${
                          field.unit ? "pr-14" : ""
                        }`}
                      />

                      {field.unit && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                          {field.unit}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
            >
              {loading ? "Menyimpan..." : "Tambahkan Device"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
