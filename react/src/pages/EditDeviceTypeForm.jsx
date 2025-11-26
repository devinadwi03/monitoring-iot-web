import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getDeviceTypeById,
  updateDeviceType,
} from "../api/deviceType";
import toast from "react-hot-toast";

export default function EditDeviceTypeForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data saat halaman dibuka
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDeviceTypeById(id);
        const dt = res.data || res;

        setName(dt.name);
        setDescription(dt.description)
        setFields(dt.settings_schema?.fields || []);
      } catch (err) {
        toast.error("Gagal memuat data device type");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // tambah field baru
  const addField = () => {
    setFields([
      ...fields,
      {
        label: "",
        key: "",
        type: "text",
        required: false,
      },
    ]);
  };

  // update field
  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  // hapus field
  const removeField = (index) => {
    const updated = fields.filter((_, i) => i !== index);
    setFields(updated);
  };

  // submit update
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name) {
      toast.error("Nama device type wajib diisi");
      return;
    }

    try {
      await updateDeviceType(id, {
        name,
        description,
        settings_schema: { fields },
      });

      toast.success("Device type berhasil diperbarui!");
      setTimeout(() => navigate("/admin/device-types"), 1000);
    } catch (err) {
      toast.error("Gagal menyimpan perubahan");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading...</div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Edit Device Type
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-lg p-6 space-y-6"
      >
        <div>
          <label className="block font-medium mb-1">Nama Device Type</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Deskripsi Device Type</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xl font-semibold">Fields</h3>
            <button
              type="button"
              onClick={addField}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
            >
              + Tambah Field
            </button>
          </div>

          <div className="space-y-4">
            {fields.length === 0 && (
              <p className="text-gray-500">Belum ada field.</p>
            )}

            {fields.map((field, index) => (
              <div
                key={index}
                className="border p-4 rounded-lg bg-gray-50 relative"
              >
                <button
                  type="button"
                  onClick={() => removeField(index)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  ✕
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm">Label</label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) =>
                        updateField(index, "label", e.target.value)
                      }
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm">Key</label>
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) =>
                        updateField(index, "key", e.target.value)
                      }
                      placeholder="ex: toren_height"
                      className="w-full border rounded px-2 py-1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm">Tipe</label>
                    <select
                      value={field.type}
                      onChange={(e) =>
                        updateField(index, "type", e.target.value)
                      }
                      className="w-full border rounded px-2 py-1"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="select">Select</option>
                      <option value="boolean">Boolean</option>
                    </select>
                  </div>

                  <div className="flex items-center mt-6">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        updateField(index, "required", e.target.checked)
                      }
                      className="mr-2"
                    />
                    <label>Required</label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg shadow"
        >
          Simpan Perubahan
        </button>
      </form>
    </div>
  );
}
