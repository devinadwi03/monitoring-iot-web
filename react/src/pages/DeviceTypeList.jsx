import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDeviceTypes, deleteDeviceType } from "../api/deviceType";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";

export default function DeviceTypeList() {
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const loadData = async () => {
    try {
      const data = await getDeviceTypes();
      setDeviceTypes(data); // tergantung backend
    } catch (err) {
      toast.error("Gagal memuat data device type");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteDeviceType(id);
      toast.success("Device Type dihapus");
      loadData();
    } catch (err) {
      toast.error("Gagal menghapus");
      console.error(err);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="p-6 max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Device Types</h2>

          <Link
            to="/admin/device-types/add"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
          >
            + Tambah Device Type
          </Link>
        </div>

        {loading ? (
          <div className="text-gray-500 text-center py-10">Loading...</div>
        ) : (
          <div className="bg-white shadow-md rounded-xl overflow-hidden">
            {/* TABLE */}
            <div className="w-full overflow-x-auto">
              <table className="min-w-[800px] w-full border-collapse">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Nama
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Deskripsi
                    </th>
                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                      Total Fields
                    </th>
                    <th className="p-4 text-center text-sm font-semibold text-gray-700">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {deviceTypes.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center text-gray-500 py-6 italic"
                      >
                        Belum ada device type.
                      </td>
                    </tr>
                  ) : (
                    deviceTypes.map((dt) => (
                      <React.Fragment key={dt.id}>
                        {/* MAIN ROW */}
                        <tr
                          onClick={() =>
                            setExpanded((prev) =>
                              prev === dt.id ? null : dt.id
                            )
                          }
                          className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <td className="p-4">{dt.name}</td>
                          <td className="p-4">{dt.description}</td>
                          <td className="p-4">
                            {dt.settings_schema?.fields?.length || 0}
                          </td>

                          <td className="p-4 text-center flex justify-center gap-2">
                            <Link
                              to={`/admin/device-types/edit/${dt.id}`}
                              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Edit
                            </Link>

                            <ConfirmModal
                              title="Hapus Device Type"
                              message={`Yakin ingin menghapus "${dt.name}"?`}
                              confirmText="Hapus"
                              confirmColor="bg-red-600 hover:bg-red-700"
                              onConfirm={() => handleDelete(dt.id)}
                              triggerButton={({ onClick }) => (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation(); // ⛔ supaya tidak expand row
                                    onClick();
                                  }}
                                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                                >
                                  Hapus
                                </button>
                              )}
                            />
                          </td>
                        </tr>

                        {/* EXPANDED DETAIL */}
                        {expanded === dt.id && (
                          <tr className="bg-gray-50 border-b">
                            <td colSpan="4" className="p-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                Detail Fields:
                              </h4>

                              {dt.settings_schema?.fields?.length > 0 ? (
                                <div className="border rounded-lg p-4 bg-white shadow-sm">
                                  <table className="w-full text-sm table-fixed">
                                    <thead>
                                      <tr className="text-gray-600 border-b">
                                        <th className="py-2 text-left w-[30%]">Label</th>
                                        <th className="py-2 text-left w-[20%]">Key</th>
                                        <th className="py-2 text-center w-[15%]">Tipe</th>
                                        <th className="py-2 text-center w-[15%]">Satuan</th>
                                        <th className="py-2 text-right w-[20%]">Default</th>
                                      </tr>
                                    </thead>

                                    <tbody>
                                      {dt.settings_schema.fields.map((f) => (
                                        <tr key={f.key} className="border-b last:border-b-0">
                                          <td className="py-2 text-left break-words">{f.label ?? "-"}</td>
                                          <td className="py-2 text-left font-mono text-xs text-gray-500 truncate ...">{f.key}</td>
                                          <td className="py-2 text-center">{f.type}</td>
                                          <td className="py-2 text-center">
                                            {f.unit ? (
                                              <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 rounded">
                                                {f.unit}
                                              </span>
                                            ) : (
                                              "-"
                                            )}
                                          </td>
                                          <td className="py-2 text-right">
                                            {f.default !== undefined
                                              ? String(f.default)
                                              : "-"}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm italic">
                                  Device type ini tidak memiliki fields.
                                </p>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
