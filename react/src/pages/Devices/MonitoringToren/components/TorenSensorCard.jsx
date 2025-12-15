import React from "react";
import {
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  CubeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export default function TorenSensorCard({ title, value, status }) {
  const icon = {
    "Tinggi Air": <ChartBarIcon className="w-5 h-5 inline-block mr-1" />,
    "Persentase Air": (
      <AdjustmentsHorizontalIcon className="w-5 h-5 inline-block mr-1" />
    ),
    "Volume Air": <CubeIcon className="w-5 h-5 inline-block mr-1" />,
    "Terakhir Update": <ClockIcon className="w-5 h-5 inline-block mr-1" />,
    "Status Sensor":
      status === "Online" ? (
        <CheckCircleIcon className="w-5 h-5 inline-block mr-1 text-green-500" />
      ) : (
        <XCircleIcon className="w-5 h-5 inline-block mr-1 text-red-500" />
      ),
  };

  return (
    <div
      className="
      bg-white rounded-xl shadow-md p-4
      flex flex-col justify-between text-center
      transition hover:-translate-y-1 hover:shadow-xl
      min-w-[160px] h-[120px]
    "
    >
      <h3 className="text-sm text-gray-500 flex items-center justify-center">
        {icon[title]} {title}
      </h3>

      <div className="text-2xl font-bold text-gray-800 flex items-center justify-center h-full">
        {value}
      </div>
    </div>
  );
}
