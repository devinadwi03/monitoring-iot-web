import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDeviceTypes, deleteDeviceType } from "../api/deviceType";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";

export default function DeviceTypeList() {
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="p-6 max-w-5xl mx-auto">
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
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3">Nama</th>
                <th className="p-3">Deskripsi</th>
                <th className="p-3">Total Fields</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {deviceTypes.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center p-4 text-gray-500">
                    Belum ada device type
                  </td>
                </tr>
              ) : (
                deviceTypes.map((dt) => (
                  <tr key={dt.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{dt.name}</td>
                    <td className="p-3 font-medium">{dt.description}</td>
                    <td className="p-3 text-gray-700">
                      {dt.settings_schema?.fields?.length || 0}
                    </td>

                    <td className="p-3 text-right space-x-2">
                      <Link
                        to={`/admin/device-types/edit/${dt.id}`}
                        className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
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
                            onClick={onClick}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
                          >
                            Hapus
                          </button>
                        )}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
