import { useMemo } from "react";
import { LegendHighlightLineChart } from "../../components/shared";

type DummyDataset = {
  label: string;
  color: string;
  data: number[];
};

const LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];

const BASE_DATASETS: DummyDataset[] = [
  {
    label: "Series A",
    color: "rgb(99, 102, 241)",
    data: [120, 160, 150, 190, 175, 210, 230, 225, 240],
  },
  {
    label: "Series B",
    color: "rgb(16, 185, 129)",
    data: [90, 110, 130, 125, 150, 165, 170, 190, 205],
  },
  {
    label: "Series C",
    color: "rgb(249, 115, 22)",
    data: [60, 80, 95, 105, 120, 140, 155, 160, 175],
  },
];

export const TestChartLegendHighlight = (): JSX.Element => {
  const chartDatasets = useMemo(
    () =>
      BASE_DATASETS.map((dataset) => ({
        label: dataset.label,
        color: dataset.color,
        data: dataset.data,
      })),
    []
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Legend Hover Highlight (Chart.js)
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Hover over the legend items below to spotlight each series, dimming
          the others. This demo uses placeholder numbers—you can replace them
          with live data and custom colors later.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-[1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Monthly Totals (Dummy Data)
              </h2>
              <p className="text-sm text-slate-500">
                Legend hover drives the highlight state; chart hover still works
                as usual.
              </p>
            </div>
          </div>

          <div className="h-[420px] w-full">
            <LegendHighlightLineChart
              labels={LABELS}
              datasets={chartDatasets}
              height={420}
              tooltipFormatter={(datasetLabel, value) =>
                `${datasetLabel}: ${value.toLocaleString()}`
              }
              title="Line Series Highlighted via Legend Hover"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          <h3 className="text-base font-semibold text-slate-800">
            Implementation Notes
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              `legend.onHover` sets the active dataset index so only that line
              stays vivid.
            </li>
            <li>
              `legend.onLeave` clears the state, returning all series to their
              balanced styling.
            </li>
            <li>
              Adjust the `BASE_DATASETS` array to plug in real API data and
              brand colors.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};
