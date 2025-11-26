import React from "react";
import {
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  CubeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export default function SensorCard({ title, value, status }) {
  // Pilihan icon sesuai title
  const icon = {
    "Tinggi Air": <ChartBarIcon className="w-5 h-5 inline-block mr-1" />,
    "Persentase Air": (
      <AdjustmentsHorizontalIcon className="w-5 h-5 inline-block mr-1" />
    ),
    "Volume Air": <CubeIcon className="w-5 h-5 inline-block mr-1" />,
    "Terakhir Update": <ClockIcon className="w-5 h-5 inline-block mr-1" />,
    "Status Sensor":
      status === "OK" ? (
        <CheckCircleIcon className="w-5 h-5 inline-block mr-1 text-green-500" />
      ) : (
        <XCircleIcon className="w-5 h-5 inline-block mr-1 text-red-500" />
      ),
  };

  return (
    <div
      className="
      bg-white rounded-xl shadow-md p-4 
      flex flex-col justify-between   /* memastikan konten seimbang */
      text-center flex-1 min-w-[160px]
      transition transform hover:-translate-y-1 hover:shadow-xl
      h-[120px]                       /* tinggi card disamakan */
    "
    >
      {/* TITLE */}
      <h3 className="text-sm text-gray-500 flex items-center justify-center">
        {icon[title]} {title}
      </h3>

      {/* VALUE — selalu benar² di tengah */}
      <div
        className="
        text-2xl font-bold text-gray-800 
        flex items-center justify-center 
        h-full                         /* buat dia selalu berada di tengah */
      "
      >
        {value}
      </div>
    </div>
  );
}
