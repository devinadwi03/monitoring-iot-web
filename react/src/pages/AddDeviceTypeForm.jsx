import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDeviceType } from "../api/deviceType";
import toast from "react-hot-toast";

export default function AddDeviceTypeForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState([]);

  const navigate = useNavigate();

  const addField = () => {
    setFields([
      ...fields,
      {
        label: "",
        key: "",
        type: "text",
        required: false,
        unit: "",
        default: "",
      },
    ]);
  };

  const removeField = (index) => {
    const updated = fields.filter((_, i) => i !== index);
    setFields(updated);
  };

  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1️⃣ Label & key wajib
    for (const f of fields) {
      if (!f.label || !f.key) {
        toast.error("Label dan Key wajib diisi");
        return;
      }
    }

    // 2️⃣ Format key
    for (const f of fields) {
      if (!/^[a-z_][a-z0-9_]*$/.test(f.key)) {
        toast.error(`Key "${f.key}" tidak valid`);
        return;
      }
    }

    // 3️⃣ Tidak boleh duplikat
    const keys = fields.map((f) => f.key);
    if (new Set(keys).size !== keys.length) {
      toast.error("Key tidak boleh duplikat");
      return;
    }

    const payload = {
      name,
      description,
      settings_schema: {
        fields,
      },
    };

    try {
      await createDeviceType(payload);
      toast.success("Device type berhasil dibuat");
      navigate("/admin/device-types");
    } catch (err) {
      console.error(err);
      toast.error("Gagal membuat device type");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-6 ">
      <div className="p-6 max-w-2xl mx-auto space-y-6 bg-white shadow rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Tambah Device Type</h2>

        {/* NAMA */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Nama Device Type</label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Monitoring Toren"
          />
        </div>

        {/* DESKRIPSI */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">
            Deskripsi Device Type
          </label>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Perangkat untuk memonitor kapasitas air"
          />
        </div>

        {/* SECTION FIELDS */}
        <div className="flex justify-between items-center mt-6 mb-2">
          <h3 className="text-xl font-semibold">Fields</h3>
          <button
            type="button"
            className="bg-blue-600 text-white px-3 py-2 rounded"
            onClick={addField}
          >
            + Tambah Field
          </button>
        </div>

        {fields.length === 0 && (
          <p className="text-gray-500 mb-3">Belum ada field.</p>
        )}

        {fields.map((field, index) => (
          <div
            key={index}
            className="border p-4 rounded-lg mb-4 bg-gray-50 relative"
          >
            <div className="flex justify-between">
              <h4 className="font-semibold">Field #{index + 1}</h4>
              <button
                type="button"
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                onClick={() => removeField(index)}
              >
                ✕
              </button>
            </div>

            {/* Label */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="mt-3">
                <label className="block mb-1">Label</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded"
                  value={field.label}
                  onChange={(e) => updateField(index, "label", e.target.value)}
                  placeholder="Contoh: Tinggi Toren"
                />
              </div>

              {/* Key */}
              <div className="mt-3">
                <label className="block mb-1">Key (nama variabel)</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded font-mono text-sm"
                  value={field.key}
                  onChange={(e) =>
                    updateField(
                      index,
                      "key",
                      e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "_")
                        .replace(/[^a-z0-9_]/g, "")
                    )
                  }
                  placeholder="contoh: tinggi_toren"
                />
              </div>

              {/* Type */}
              <div className="mt-3">
                <label className="block mb-1">Tipe</label>
                <select
                  className="w-full border px-3 py-2 rounded"
                  value={field.type}
                  onChange={(e) => updateField(index, "type", e.target.value)}
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                </select>
              </div>

              {/* Unit / Satuan */}
              <div className="mt-3">
                <label className="block mb-1">Satuan</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded"
                  value={field.unit}
                  onChange={(e) => updateField(index, "unit", e.target.value)}
                  placeholder="Contoh: cm, liter, %"
                />
              </div>

              {/* DEFAULT VALUE */}
              <div className="mt-3">
                <label className="block mb-1">Default Value</label>
                <input
                  type={field.type === "number" ? "number" : "text"}
                  className="w-full border px-3 py-2 rounded"
                  value={field.default}
                  onChange={(e) =>
                    updateField(index, "default", e.target.value)
                  }
                  placeholder="Nilai awal"
                />
              </div>

              {/* REQUIRED */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) =>
                    updateField(index, "required", e.target.checked)
                  }
                />
                <label>Required</label>
              </div>
            </div>
          </div>
        ))}

        {/* SUBMIT */}
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded w-full mt-4"
        >
          Simpan Device Type
        </button>
      </div>
    </div>
  );
}
