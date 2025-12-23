import React, { useCallback, useMemo, useState, CSSProperties } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  LegendItem,
  ChartEvent,
  LegendPosition,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend
);

type LegendHighlightDataset = {
  label: string;
  color: string;
  data: number[];
};

const withOpacity = (rgbColor: string, opacity: number) => {
  if (!rgbColor.startsWith("rgb(")) {
    return rgbColor;
  }

  return rgbColor.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
};

export interface LegendHighlightBarChartProps {
  labels: string[];
  datasets: LegendHighlightDataset[];
  className?: string;
  height?: number | string;
  title?: string;
  legendPosition?: LegendPosition;
  tooltipFormatter?: (datasetLabel: string, value: number) => string;
  chartOptions?: ChartOptions<"bar">;
  showLegend?: boolean;
  activeDatasetIndex?: number | null;
  onActiveDatasetIndexChange?: (index: number | null) => void;
}

export const LegendHighlightBarChart = ({
  labels,
  datasets,
  className,
  height = 360,
  title,
  legendPosition = "top",
  tooltipFormatter,
  chartOptions,
  showLegend = true,
  activeDatasetIndex: controlledActiveIndex,
  onActiveDatasetIndexChange,
}: LegendHighlightBarChartProps): JSX.Element => {
  const [internalActiveIndex, setInternalActiveIndex] = useState<number | null>(
    null
  );

  const isControlled = controlledActiveIndex !== undefined;
  const activeDatasetIndex = isControlled
    ? controlledActiveIndex ?? null
    : internalActiveIndex;

  const setActiveDatasetIndex = useCallback(
    (index: number | null) => {
      if (!isControlled) {
        setInternalActiveIndex(index);
      }
      onActiveDatasetIndexChange?.(index);
    },
    [isControlled, onActiveDatasetIndexChange]
  );

  const chartData = useMemo<ChartData<"bar">>(() => {
    return {
      labels,
      datasets: datasets.map((dataset, index) => {
        const isActive = activeDatasetIndex === index;
        const isDimmed =
          activeDatasetIndex !== null && activeDatasetIndex !== index;

        return {
          label: dataset.label,
          data: dataset.data,
          backgroundColor: isDimmed
            ? withOpacity(dataset.color, 0.3)
            : withOpacity(dataset.color, isActive ? 0.8 : 0.6),
          borderColor: isDimmed
            ? withOpacity(dataset.color, 0.3)
            : dataset.color,
          borderWidth: isActive ? 2 : isDimmed ? 1 : 1.5,
          borderRadius: 4,
        };
      }),
    };
  }, [labels, datasets, activeDatasetIndex]);

  const defaultOptions = useMemo<ChartOptions<"bar">>(() => {
    const baseTooltipFormatter =
      tooltipFormatter ??
      ((datasetLabel: string, value: number) =>
        `${datasetLabel}: ${value.toLocaleString()}`);

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
      plugins: {
        legend: {
          display: showLegend,
          position: legendPosition,
          align: "center",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
          },
          onHover: (event: ChartEvent, legendItem: LegendItem) => {
            if (!showLegend) {
              return;
            }

            const datasetIndex = legendItem.datasetIndex;
            if (typeof datasetIndex !== "number") {
              return;
            }

            const target = event?.native?.target as HTMLElement | null;
            if (target) {
              target.style.cursor = "pointer";
            }

            setActiveDatasetIndex(datasetIndex);
          },
          onLeave: (event: ChartEvent) => {
            if (!showLegend) {
              return;
            }

            const target = event?.native?.target as HTMLElement | null;
            if (target) {
              target.style.cursor = "default";
            }

            setActiveDatasetIndex(null);
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y ?? 0;
              return baseTooltipFormatter(context.dataset.label ?? "", value);
            },
          },
        },
        title: {
          display: Boolean(title),
          text: title,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(148, 163, 184, 0.2)",
          },
          ticks: {
            callback: (value) =>
              typeof value === "number"
                ? value.toLocaleString()
                : value.toString(),
          },
        },
      },
    };
  }, [
    legendPosition,
    setActiveDatasetIndex,
    showLegend,
    title,
    tooltipFormatter,
  ]);

  const mergedOptions = useMemo<ChartOptions<"bar">>(() => {
    if (!chartOptions) {
      return defaultOptions;
    }

    const merged: ChartOptions<"bar"> = {
      ...defaultOptions,
      ...chartOptions,
      plugins: {
        ...defaultOptions.plugins,
        ...chartOptions.plugins,
        legend: {
          ...defaultOptions.plugins?.legend,
          ...chartOptions.plugins?.legend,
          display:
            chartOptions.plugins?.legend?.display ?? defaultOptions.plugins?.legend?.display,
        },
        tooltip: {
          ...defaultOptions.plugins?.tooltip,
          ...chartOptions.plugins?.tooltip,
        },
        title: {
          ...defaultOptions.plugins?.title,
          ...chartOptions.plugins?.title,
        },
      },
      scales: {
        ...defaultOptions.scales,
      },
    };

    if (chartOptions.scales) {
      Object.entries(chartOptions.scales).forEach(([key, value]) => {
        const baseScale = defaultOptions.scales?.[key];
        merged.scales = merged.scales ?? {};
        merged.scales[key] = {
          ...baseScale,
          ...value,
        };
      });
    }

    return merged;
  }, [defaultOptions, chartOptions]);

  const containerStyle = useMemo<CSSProperties | undefined>(() => {
    if (typeof height === "number") {
      return { height: `${height}px` };
    }

    if (typeof height === "string") {
      return { height };
    }

    return undefined;
  }, [height]);

  return (
    <div className={`relative w-full ${className ?? ""}`}>
      <div className="w-full" style={containerStyle}>
        <Bar options={mergedOptions} data={chartData} />
      </div>
    </div>
  );
};

