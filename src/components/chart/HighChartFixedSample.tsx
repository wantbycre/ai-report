"use client";

import { useEffect, useMemo, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Button } from "@/components/ui/button";
import type { TickerInfo } from "@/components/chart/GoldChart";
import {
  type HighChartMockKey,
  buildHighChartMockData,
  toTickerFromHighChartPoints,
} from "@/components/chart/highChartMockData";

const RANGES: { key: HighChartMockKey; label: string }[] = [
  { key: "day", label: "일" },
  { key: "week", label: "주" },
  { key: "quarter", label: "분기" },
  { key: "year", label: "년" },
];

interface Props {
  onTick?: (ticker: TickerInfo) => void;
}

export default function HighChartFixedSample({ onTick }: Props) {
  const [range, setRange] = useState<HighChartMockKey>("day");
  const points = useMemo(() => buildHighChartMockData(range), [range]);

  useEffect(() => {
    const tick = toTickerFromHighChartPoints(points);
    if (tick) onTick?.(tick);
  }, [points, onTick]);

  const options = useMemo<Highcharts.Options>(() => {
    const isYear = range === "year";
    return {
      chart: {
        type: "line",
        height: 500,
        backgroundColor: "#ffffff",
        animation: false,
        spacing: [8, 8, 8, 8],
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: false },
      tooltip: {
        shared: false,
        useHTML: false,
        valueDecimals: 2,
        xDateFormat: isYear ? "%Y-%m" : "%H:%M",
      },
      xAxis: {
        type: "datetime",
        minPadding: 0,
        maxPadding: 0,
        labels: { format: isYear ? "{value:%m/%d}" : "{value:%H:%M}" },
        lineColor: "rgba(0,0,0,0.08)",
        tickColor: "rgba(0,0,0,0.08)",
      },
      yAxis: {
        title: { text: undefined },
        gridLineColor: "rgba(0,0,0,0.06)",
        opposite: true,
      },
      plotOptions: {
        series: {
          animation: false,
          states: { hover: { enabled: false } },
          marker: { enabled: false },
          turboThreshold: 5000,
        },
      },
      series: [
        {
          type: "line",
          data: points.map((p) => [p.x, p.y]),
          color: "#dd3c44",
          lineWidth: 2,
        },
      ],
    };
  }, [points, range]);

  return (
    <div className="w-full">
      <div className="mb-2 flex flex-wrap items-center gap-1">
        {RANGES.map(({ key, label }) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={range === key ? "default" : "outline"}
            onClick={() => setRange(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
