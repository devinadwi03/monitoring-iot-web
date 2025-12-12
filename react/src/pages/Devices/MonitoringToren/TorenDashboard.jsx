import React, { useEffect, useState, useMemo } from "react";

import TorenSensorCard from "./components/TorenSensorCard";
import TorenChart from "./components/TorenChart";
import TorenTable from "./components/TorenTable";
import TorenAlert from "./components/TorenAlert";

// API
import { getDeviceTypeById } from "../../../api/deviceType";
import { getDeviceSettings } from "../../../api/deviceSettings";
import { getSensorData } from "../../../api/sensor";

export default function TorenDashboard({ device, role }) {
  const deviceId = device?.id;

  const [deviceType, setDeviceType] = useState(null);
  const [torenConst, setTorenConst] = useState({
    TINGGI_TOREN: 200,
    KAPASITAS_TOREN: 1000,
    BATAS_MINIMUM: 20,
  });

  // DATA SUMMARY CARD
  const [hc, setHc] = useState({});
  const [jsn, setJsn] = useState({});

  // CHART
  const [labels, setLabels] = useState([]);
  const [dataHC, setDataHC] = useState([]);
  const [dataJSN, setDataJSN] = useState([]);

  // TABLE
  const [sensorData, setSensorData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("time-desc");
  const [viewMode, setViewMode] = useState("visual");

  // ALERT
  const [alert, setAlert] = useState(false);

  /////////////////////////////////////////////////////////////////////////////
  // 🔵 FORMAT TANGGAL
  /////////////////////////////////////////////////////////////////////////////
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

    return `${hari[date.getDay()]}, ${date.getDate()} ${
      bulan[date.getMonth()]
    } ${date.getFullYear()} ${String(date.getHours()).padStart(
      2,
      "0"
    )}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  /////////////////////////////////////////////////////////////////////////////
  // 🔵 STATUS SENSOR
  /////////////////////////////////////////////////////////////////////////////
  function getStatus(jarak, lastUpdate) {
    if (jarak === null || isNaN(jarak)) return "Offline";
    if (jarak === -1) return "Error";

    const diff = (new Date() - new Date(lastUpdate)) / 1000;
    return diff > 120 ? "Offline" : "Online";
  }

  /////////////////////////////////////////////////////////////////////////////
  // 🔵 LOAD DEVICE TYPE + SETTINGS
  /////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (!deviceId) return;

    const loadAll = async () => {
      try {
        // GET DEVICE TYPE
        if (device.device_type_id) {
          const dt = await getDeviceTypeById(device.device_type_id);
          setDeviceType(dt);
        }

        // GET DEVICE SETTINGS
        const resSettings = await getDeviceSettings(deviceId);
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
        console.error("Gagal load type/settings:", err);
      }
    };

    loadAll();
  }, [deviceId, device]);

  /////////////////////////////////////////////////////////////////////////////
  // 🔵 LOAD SENSOR DATA + REALTIME
  /////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (!deviceId) return;

    const fetchData = async () => {
      try {
        const data = await getSensorData(deviceId);
        if (!data || data.length === 0) return;

        setSensorData(data);

        const latestData = data.slice(0, 5).reverse();
        const newest = latestData[latestData.length - 1];

        const jarak_hc = newest.field1 ?? null;
        const jarak_jsn = newest.field2 ?? null;
        const lastUpdate = newest.created_at;

        const T = torenConst.TINGGI_TOREN;
        const C = torenConst.KAPASITAS_TOREN;
        const B = torenConst.BATAS_MINIMUM;

        const tinggi_hc = T - (jarak_hc ?? 0);
        const tinggi_jsn = T - (jarak_jsn ?? 0);

        const persen_hc = (tinggi_hc / T) * 100;
        const persen_jsn = (tinggi_jsn / T) * 100;

        const volume_hc = (tinggi_hc / T) * C;
        const volume_jsn = (tinggi_jsn / T) * C;

        const timestamp = formatTanggalLengkap(lastUpdate.replace(" ", "T"));

        // SUMMARY CARD
        setHc({
          tinggi: tinggi_hc.toFixed(1) + " cm",
          persen: persen_hc.toFixed(1) + "%",
          volume: volume_hc.toFixed(1) + " L",
          time: timestamp,
          status: getStatus(jarak_hc, lastUpdate),
        });

        setJsn({
          tinggi: tinggi_jsn.toFixed(1) + " cm",
          persen: persen_jsn.toFixed(1) + "%",
          volume: volume_jsn.toFixed(1) + " L",
          time: timestamp,
          status: getStatus(jarak_jsn, lastUpdate),
        });

        // ALERT
        setAlert(persen_hc < B || persen_jsn < B);

        // CHART
        setLabels(
          latestData.map((d) =>
            formatTanggalLengkap(d.created_at.replace(" ", "T"))
          )
        );

        setDataHC(latestData.map((d) => ((T - (d.field1 ?? 0)) / T) * 100));

        setDataJSN(latestData.map((d) => ((T - (d.field2 ?? 0)) / T) * 100));
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, [deviceId, torenConst]);

  /////////////////////////////////////////////////////////////////////////////
  // 🔵 TABLE FILTER + SORT
  /////////////////////////////////////////////////////////////////////////////
  const tableData = useMemo(() => {
    const filtered = sensorData.filter((item) =>
      [item.created_at, item.field1, item.field2]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
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
  }, [sensorData, searchTerm, sortOption]);

  /////////////////////////////////////////////////////////////////////////////
  // 🔵 RENDER UI
  /////////////////////////////////////////////////////////////////////////////
  if (!device)
    return <div className="text-gray-500 text-center py-10">Loading...</div>;

  if (deviceType?.name !== "Monitoring Toren") {
    return (
      <div className="p-6 text-center text-gray-600">
        Perangkat ini bukan jenis <b>Monitoring Toren</b>.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          Dashboard Monitoring Toren
        </h1>

        {role === "admin" && (
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <label className="text-sm text-gray-600">Tampilan:</label>
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
      {alert && <TorenAlert />}

      {/* VISUAL MODE */}
      {viewMode === "visual" && (
        <>
          {/* SUMMARY CARD */}

          {/* SENSOR HC-SR04 */}
          <section className="mt-8">
            <h2
              className="text-lg font-semibold text-blue-600 mb-3 text-center relative
          after:block after:w-16 after:h-1 after:bg-blue-300 after:rounded-full after:mx-auto after:mt-1"
            >
              Sensor HC-SR04
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <TorenSensorCard title="Tinggi Air" value={hc.tinggi} />
              <TorenSensorCard title="Persentase Air" value={hc.persen} />
              <TorenSensorCard title="Volume Air" value={hc.volume} />
              <TorenSensorCard title="Terakhir Update" value={hc.time} />
              <TorenSensorCard
                title="Status Sensor"
                value={hc.status}
                status={hc.status}
              />
            </div>
          </section>

          {/* SENSOR JSN-SR04T */}
          <section className="mt-10">
            <h2
              className="text-lg font-semibold text-green-600 mb-3 text-center relative
          after:block after:w-16 after:h-1 after:bg-green-300 after:rounded-full after:mx-auto after:mt-1"
            >
              Sensor JSN-SR04T
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <TorenSensorCard title="Tinggi Air" value={jsn.tinggi} />
              <TorenSensorCard title="Persentase Air" value={jsn.persen} />
              <TorenSensorCard title="Volume Air" value={jsn.volume} />
              <TorenSensorCard title="Terakhir Update" value={jsn.time} />
              <TorenSensorCard
                title="Status Sensor"
                value={jsn.status}
                status={jsn.status}
              />
            </div>
          </section>

          {/* CHART */}
          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
              Grafik Level Air
            </h2>
            <div className="bg-white shadow-md rounded-xl p-4">
              <TorenChart labels={labels} dataHC={dataHC} dataJSN={dataJSN} />
            </div>
          </section>
        </>
      )}

      {/* TABLE MODE */}
      {role === "admin" && viewMode === "table" && (
        <TorenTable
          data={tableData} // data yang sudah filter + sort
          searchTerm={searchTerm} // state search dari parent
          sortOption={sortOption} // state sort dari parent
          onSearchChange={setSearchTerm} // callback untuk update search
          onSortChange={setSortOption} // callback untuk update sort
        />
      )}
    </div>
  );
}
