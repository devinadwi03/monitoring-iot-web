import React from "react";

export default function TorenTable({ data, searchTerm, sortOption, onSearchChange, onSortChange }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">
        Data Sensor (Tabel)
      </h2>

      {/* 🔹 Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        {/* 🔍 Search Input */}
        <input
          type="text"
          placeholder="Cari data sensor..."
          className="border border-gray-300 rounded-xl px-4 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        {/* ↕️ Sort Dropdown */}
        <select
          className="border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={sortOption}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="time-desc">Waktu Terbaru</option>
          <option value="time-asc">Waktu Terlama</option>
          <option value="hc-desc">Jarak HC Tertinggi</option>
          <option value="hc-asc">Jarak HC Terendah</option>
          <option value="jsn-desc">Jarak JSN Tertinggi</option>
          <option value="jsn-asc">Jarak JSN Terendah</option>
        </select>
      </div>

      {/* 🔹 Tabel */}
      <div className="overflow-x-auto bg-white rounded-xl shadow max-h-[420px] overflow-y-auto">
        <table className="min-w-full border-collapse">
          <thead className="sticky top-0 bg-gray-100 z-10">
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-2 text-left text-gray-700">Waktu</th>
              <th className="px-4 py-2 text-left text-gray-700">Jarak HC</th>
              <th className="px-4 py-2 text-left text-gray-700">Jarak JSN</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center text-gray-500 py-6 italic">
                  Tidak ada data yang cocok dengan pencarian.
                </td>
              </tr>
            ) : (
              data.map((item, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{item.created_at}</td>
                  <td className="px-4 py-2">{item.field1 ?? "-"}</td>
                  <td className="px-4 py-2">{item.field2 ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
