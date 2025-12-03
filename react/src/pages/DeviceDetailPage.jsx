import React, { useState, useEffect } from "react";
import SensorCard from "../components/SensorCard";
import ChartComponent from "../components/ChartComponent";
import { XCircleIcon } from "@heroicons/react/24/solid";
import { getSensorData } from "../api/sensor";
import { getDevice } from "../api/device"; // harus ada endpoint: GET /device/:id
import { getDeviceSettings } from "../api/deviceSettings";
import { getDeviceTypeById } from "../api/deviceType";
import { useParams } from "react-router-dom";
import { getMe } from "../api/auth"; // ambil data dari /me

export default function DeviceDetailPage() {
  const { deviceId } = useParams();
  const [device, setDevice] = useState(null);
  const [deviceType, setDeviceType] = useState(null);
  const [role, setRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("time-desc");
  const [viewMode, setViewMode] = useState("visual"); // 'visual' | 'table'
  const [sensorData, setSensorData] = useState([]);
  const [hc, setHc] = useState({
    tinggi: "-",
    persen: "-",
    volume: "-",
    time: "-",
    status: "-",
  });
  const [jsn, setJsn] = useState({
    tinggi: "-",
    persen: "-",
    volume: "-",
    time: "-",
    status: "-",
  });
  const [alert, setAlert] = useState(false);
  const [labels, setLabels] = useState([]);
  const [dataHC, setDataHC] = useState([]);
  const [dataJSN, setDataJSN] = useState([]);

  // ambil device + device type + settings saat mount / deviceId berubah
  useEffect(() => {
    if (!deviceId) return;

    const loadAll = async () => {
      try {
        const dev = await getDevice(deviceId); // pastikan getDevice mengembalikan res.data
        setDevice(dev);

        // ambil deviceType via API khusus
        if (dev.device_type_id) {
          const dt = await getDeviceTypeById(dev.device_type_id); // mengembalikan res.data
          setDeviceType(dt);
        } else {
          setDeviceType(null);
        }

        // ambil settings per device
        const resSettings = await getDeviceSettings(deviceId); // mengembalikan array settings
        const obj = {};
        (resSettings.data || resSettings || []).forEach((s) => {
          obj[s.key] = s.value;
        });

        setTorenConst({
          TINGGI_TOREN: Number(obj.tinggi_toren ?? obj.tinggi ?? 200),
          KAPASITAS_TOREN: Number(obj.kapasitas_toren ?? obj.kapasitas ?? 1000),
          BATAS_MINIMUM: Number(obj.batas_minimum ?? obj.batas_min ?? 20),
        });
      } catch (err) {
        console.error("Gagal load device/type/settings:", err);
      }
    };

    loadAll();
  }, [deviceId]);

  const [torenConst, setTorenConst] = useState({
    TINGGI_TOREN: 200,
    KAPASITAS_TOREN: 1000,
    BATAS_MINIMUM: 20,
  });

  // Ambil profil user (buat cek role)
  useEffect(() => {
    getMe()
      .then((res) => setRole(res.role))
      .catch((err) => console.error("Gagal ambil role:", err));
  }, []);

  function formatTanggalLengkap(dt) {
    const date = new Date(dt);

    const hari = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const bulan = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];

    const namaHari = hari[date.getDay()];
    const tanggal = date.getDate();
    const namaBulan = bulan[date.getMonth()];
    const tahun = date.getFullYear();

    const jam = date.getHours().toString().padStart(2, "0");
    const menit = date.getMinutes().toString().padStart(2, "0");

    return `${namaHari}, ${tanggal} ${namaBulan} ${tahun} ${jam}:${menit}`;
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getSensorData(deviceId); // ambil langsung dari DB
        if (!data || data.length === 0) return;

        // simpan seluruh data mentah ke state (kalau dipakai di tempat lain)
        setSensorData(data);

        // Ambil maksimal 5 data terakhir dari database
        const latestData = data.slice(0, 5).reverse(); // urut dari lama ke baru

        // Ambil data terbaru untuk status
        const newest = latestData[latestData.length - 1];
        const jarak_hc = newest.field1 ?? null;
        const jarak_jsn = newest.field2 ?? null;
        const lastUpdate = newest.created_at;

        const T = torenConst?.TINGGI_TOREN ?? 200;
        const C = torenConst?.KAPASITAS_TOREN ?? 1000;
        const B = torenConst?.BATAS_MINIMUM ?? 20;

        const status_hc = getStatus(jarak_hc, lastUpdate);
        const status_jsn = getStatus(jarak_jsn, lastUpdate);

        const tinggi_hc = T - (jarak_hc ?? 0);
        const tinggi_jsn = T - (jarak_jsn ?? 0);

        const persen_hc = (tinggi_hc / T) * 100;
        const persen_jsn = (tinggi_jsn / T) * 100;

        const volume_hc = (tinggi_hc / T) * C;
        const volume_jsn = (tinggi_jsn / T) * C;

        // 🔥 FORMAT TANGGAL BARU
        const timestamp = formatTanggalLengkap(lastUpdate.replace(" ", "T"));

        setHc({
          tinggi: tinggi_hc.toFixed(1) + " cm",
          persen: persen_hc.toFixed(1) + "%",
          volume: volume_hc.toFixed(1) + " L",
          time: timestamp,
          status: status_hc,
        });

        setJsn({
          tinggi: tinggi_jsn.toFixed(1) + " cm",
          persen: persen_jsn.toFixed(1) + "%",
          volume: volume_jsn.toFixed(1) + " L",
          time: timestamp,
          status: status_jsn,
        });

        setAlert(persen_hc < B || persen_jsn < B);

        // ✅ Update chart pakai 5 data terakhir dari DB
        const labelsArr = latestData.map((d) =>
          formatTanggalLengkap(d.created_at.replace(" ", "T"))
        );

        const hcArr = latestData.map((d) => {
          const tinggi = T - (d.field1 ?? 0);
          return (tinggi / T) * 100;
        });

        const jsnArr = latestData.map((d) => {
          const tinggi = T - (d.field2 ?? 0);
          return (tinggi / T) * 100;
        });

        setLabels(labelsArr);
        setDataHC(hcArr);
        setDataJSN(jsnArr);
      } catch (err) {
        console.error("Error fetching data", err);
      }
    };

    const interval = setInterval(fetchData, 20000);
    fetchData();
    return () => clearInterval(interval);
  }, [deviceId, torenConst]);

  function getStatus(jarak, lastUpdate) {
    if (jarak === null || isNaN(jarak)) return "Offline";
    if (jarak === -1) return "Error";
    const now = new Date();
    const last = new Date(lastUpdate);
    const diff = (now - last) / 1000;
    if (diff > 120) return "Offline";
    return "Online";
  }

  // 🔍 Filter berdasarkan search
  const filteredData = sensorData.filter((item) =>
    [item.created_at, item.field1?.toString(), item.field2?.toString()]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // ↕️ Urutkan hasil filter
  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortOption) {
      case "time-asc":
        return new Date(a.created_at) - new Date(b.created_at);
      case "time-desc":
        return new Date(b.created_at) - new Date(a.created_at);
      case "hc-asc":
        return (a.field1 ?? 0) - (b.field1 ?? 0);
      case "hc-desc":
        return (b.field1 ?? 0) - (a.field1 ?? 0);
      case "jsn-asc":
        return (a.field2 ?? 0) - (b.field2 ?? 0);
      case "jsn-desc":
        return (b.field2 ?? 0) - (a.field2 ?? 0);
      default:
        return 0;
    }
  });

  if (!device) return <div className="text-gray-500 text-center py-10">Loading...</div>;

  if (deviceType?.name !== "Monitoring Toren") {
    return (
      <div className="p-6 text-center text-gray-600">
        Perangkat ini bukan jenis <b>Monitoring Toren</b>.
      </div>
    );
  }
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Dashboard Monitoring Toren
        </h1>

        {/* Hanya admin yang bisa ubah mode tampilan */}
        {role === "admin" && (
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <label className="text-sm text-gray-600 whitespace-nowrap">
              Tampilan:
            </label>
            <select
              className="border rounded-lg p-2 bg-white text-gray-700 shadow-sm w-full sm:w-auto"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="visual">Visual</option>
              <option value="table">Tabel</option>
            </select>
          </div>
        )}
      </div>

      {/* ALERT */}
      {alert && (
        <div className="bg-red-100 border-l-4 border-red-600 text-red-700 p-4 rounded shadow flex items-center gap-2">
          <XCircleIcon className="w-6 h-6" />
          <span>Air di bawah batas minimum!</span>
        </div>
      )}

      {/* MODE VISUAL */}
      {viewMode === "visual" && (
        <>
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-blue-600 mb-3 text-center relative after:block after:w-16 after:h-1 after:bg-blue-300 after:rounded-full after:mx-auto after:mt-1">
              Sensor HC-SR04
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <SensorCard title="Tinggi Air" value={hc.tinggi} />
              <SensorCard title="Persentase Air" value={hc.persen} />
              <SensorCard title="Volume Air" value={hc.volume} />
              <SensorCard title="Terakhir Update" value={hc.time} />
              <SensorCard
                title="Status Sensor"
                value={hc.status}
                status={hc.status}
              />
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-semibold text-green-600 mb-3 text-center relative after:block after:w-16 after:h-1 after:bg-green-300 after:rounded-full after:mx-auto after:mt-1">
              Sensor JSN-SR04T
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <SensorCard title="Tinggi Air" value={jsn.tinggi} />
              <SensorCard title="Persentase Air" value={jsn.persen} />
              <SensorCard title="Volume Air" value={jsn.volume} />
              <SensorCard title="Terakhir Update" value={jsn.time} />
              <SensorCard
                title="Status Sensor"
                value={jsn.status}
                status={jsn.status}
              />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
              Grafik Level Air
            </h2>
            <div className="bg-white shadow-md rounded-xl p-4">
              <ChartComponent
                labels={labels}
                dataHC={dataHC}
                dataJSN={dataJSN}
              />
            </div>
          </section>
        </>
      )}

      {/* MODE TABEL (hanya admin) */}
      {role === "admin" && viewMode === "table" && (
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
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {/* ↕️ Sort Dropdown */}
            <select
              className="border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
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
          <div className="overflow-x-auto bg-white rounded-xl shadow">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-2 text-left text-gray-700">Waktu</th>
                  <th className="px-4 py-2 text-left text-gray-700">
                    Jarak HC
                  </th>
                  <th className="px-4 py-2 text-left text-gray-700">
                    Jarak JSN
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan="3"
                      className="text-center text-gray-500 py-6 italic"
                    >
                      Tidak ada data yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  sortedData.map((item, i) => (
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
      )}
    </div>
  );
}
