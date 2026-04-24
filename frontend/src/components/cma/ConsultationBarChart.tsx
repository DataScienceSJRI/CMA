import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

interface ConsultationBarChartProps {
  categories: string[];
  data: number[];
  title?: string;
  height?: number;
  color?: string;
}

export default function ConsultationBarChart({
  categories,
  data,
  title = "Monthly Consultations",
  height = 300,
  color = "#0a766d",
}: ConsultationBarChartProps) {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: "45%",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: {
        style: {
          colors: "#6b7280",
          fontSize: "12px",
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#6b7280",
          fontSize: "12px",
        },
      },
    },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 4,
    },
    colors: [color],
    tooltip: {
      theme: "dark",
    },
  };

  const series = [{ name: title, data }];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-base font-medium text-gray-800 dark:text-white/90">
        {title}
      </h3>
      <Chart options={options} series={series} type="bar" height={height} />
    </div>
  );
}
