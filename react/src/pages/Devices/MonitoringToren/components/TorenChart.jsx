import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function TorenChart({ labels, dataHC, dataJSN }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Jika chart belum ada, buat baru
    if (!chartInstance.current) {
      chartInstance.current = new Chart(chartRef.current, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "HC-SR04",
              data: dataHC,
              borderColor: "#2563EB",
              backgroundColor: "rgba(37, 99, 235, 0.2)",
              tension: 0.4,
              fill: true,
            },
            {
              label: "JSN-SR04T",
              data: dataJSN,
              borderColor: "#16A34A",
              backgroundColor: "rgba(22, 163, 74, 0.2)",
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "nearest", axis: "x", intersect: false },
          plugins: {
            legend: { position: "top" },
            tooltip: { mode: "index", intersect: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Persentase Air (%)",
                color: "#374151",
                font: { weight: "bold" },
              },
              grid: { color: "rgba(0,0,0,0.05)" },
            },
            x: {
              title: {
                display: true,
                text: "Waktu",
                color: "#374151",
                font: { weight: "bold" },
              },
              grid: { color: "rgba(0,0,0,0.05)" },
            },
          },
        },
      });
    } else {
      // Update chart tanpa destroy
      const chart = chartInstance.current;

      const safeLabels = labels.length >= 5 ? labels.slice(-5) : labels;
      const safeHC = dataHC.length >= 5 ? dataHC.slice(-5) : dataHC;
      const safeJSN = dataJSN.length >= 5 ? dataJSN.slice(-5) : dataJSN;

      chart.data.labels = safeLabels;
      chart.data.datasets[0].data = safeHC;
      chart.data.datasets[1].data = safeJSN;
      chart.update("active");
    }

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
      chartInstance.current = null;
    };
  }, [labels, dataHC, dataJSN]);

  return <canvas ref={chartRef} className="w-full h-96"></canvas>;
}
