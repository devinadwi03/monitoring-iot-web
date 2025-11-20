import React, { useEffect, useState } from "react";
import DeviceCard from "../components/DeviceCard";
import { useNavigate } from "react-router-dom";
import { getDevices, updateDevice, deleteDevice, regenerateApiKey } from "../api/device";
import { getMe } from "../api/auth";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const [devices, setDevices] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("name-asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [modalType, setModalType] = useState(null); // "delete" atau "regenerate"

  const navigate = useNavigate();

  // 🔹 Ambil data user (termasuk role)
  useEffect(() => {
    async function fetchUserAndDevices() {
      try {
        const userData = await getMe();
        setUser(userData);

        const deviceData = await getDevices();
        setDevices(deviceData);
      } catch (error) {
        console.error("Gagal ambil data:", error);
        toast.error("Gagal memuat data perangkat atau user.");
      } finally {
        setLoading(false);
      }
    }
    fetchUserAndDevices();
  }, []);

  const handleEdit = async (id, updatedData) => {
    try {
      const updated = await updateDevice(id, updatedData);
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updated } : d))
      );
      toast.success("Device berhasil diedit");
    } catch (error) {
      console.error("Gagal update device:", error);
      toast.error(
        error.response?.data?.message || "Gagal mengedit device. Coba lagi."
      );
    }
  };

  const handleDeleteClick = (device) => {
    setSelectedDevice(device);
    setModalType("delete");
    setModalOpen(true);
  };

  const handleRegenerateClick = (device) => {
    setSelectedDevice(device);
    setModalType("regenerate");
    setModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedDevice) return;

    try {
      if (modalType === "delete") {
        await deleteDevice(selectedDevice.id);
        setDevices((prev) => prev.filter((d) => d.id !== selectedDevice.id));
        toast.success("Device berhasil dihapus.");
      } else if (modalType === "regenerate") {
        const data = await regenerateApiKey(selectedDevice.id);
        setDevices((prev) =>
          prev.map((d) =>
            d.id === selectedDevice.id ? { ...d, api_key: data.api_key } : d
          )
        );
        toast.success("API Key berhasil digenerate ulang!");
      }
    } catch (error) {
      console.error("Gagal menjalankan aksi:", error);
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setModalOpen(false);
      setSelectedDevice(null);
      setModalType(null);
    }
  };

  // 🔎 Filter data
  const filteredDevices = devices.filter((d) =>
    [d.name, d.location, d.serial_number]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // ↕️ Urutkan data
  const sortedDevices = [...filteredDevices].sort((a, b) => {
    switch (sortOption) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "created-desc":
        return new Date(b.created_at) - new Date(a.created_at);
      case "created-asc":
        return new Date(a.created_at) - new Date(b.created_at);
      default:
        return 0;
    }
  });

  return (
    <div className="bg-gray-50 min-h-screen py-6">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* 🔹 Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-3xl font-bold text-gray-800 text-center sm:text-left">
            Pilih Perangkat IoT
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* 🔍 Search Input */}
            <input
              type="text"
              placeholder="Cari perangkat..."
              className="border border-gray-300 rounded-xl px-4 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* ↕️ Sort Dropdown */}
            <select
              className="border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="name-asc">Nama (A–Z)</option>
              <option value="name-desc">Nama (Z–A)</option>
              <option value="created-desc">Terbaru</option>
              <option value="created-asc">Terlama</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-500 text-center py-10">Loading...</div>
        ) : sortedDevices.length === 0 ? (
          <div className="text-gray-500 text-center py-10">
            {devices.length === 0
              ? "Belum ada perangkat terdaftar."
              : "Tidak ada perangkat yang cocok dengan pencarian."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedDevices.map((d) => (
              <DeviceCard
                key={d.id}
                id={d.id}
                name={d.name}
                serial_number={d.serial_number}
                location={d.location}
                api_key={d.api_key}
                created_at={d.created_at}
                updated_at={d.updated_at}
                role={user?.role} // 🔹 kirim role ke card
                onClick={() => navigate(`/device/${d.id}`)}
                onEdit={handleEdit}
                onDelete={() => handleDeleteClick(d)}
                onRegenerate={() => handleRegenerateClick(d)}
              />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <ConfirmModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={
            modalType === "delete"
              ? "Konfirmasi Hapus"
              : "Konfirmasi Generate Ulang API Key"
          }
          message={
            modalType === "delete"
              ? `Yakin ingin menghapus device "${selectedDevice?.name}"?`
              : `Yakin ingin generate ulang API key untuk "${selectedDevice?.name}"?`
          }
          confirmText={
            modalType === "delete" ? "Ya, Hapus" : "Ya, Generate Ulang"
          }
          cancelText="Batal"
          confirmColor={
            modalType === "delete"
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          }
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
}
