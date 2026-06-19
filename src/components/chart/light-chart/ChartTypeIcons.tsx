import { CHART_COLORS } from "./lightChartConfig";
import type { ChartType } from "./lightChartTypes";

interface ChartTypeIconProps {
  type: ChartType;
}

export function ChartTypeIcon({ type }: ChartTypeIconProps) {
  if (type === "line") {
    return (
      <svg
        width="18"
        height="14"
        viewBox="0 0 18 14"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M1 10.5 4.5 7.5 8 8.5 11.5 4 16 5.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width="18"
      height="14"
      viewBox="0 0 18 14"
      fill="none"
      aria-hidden="true"
    >
      {/* 양봉 */}
      <line
        x1="5"
        y1="1.5"
        x2="5"
        y2="12.5"
        stroke={CHART_COLORS.candleUp}
        strokeWidth="1"
      />
      <rect
        x="3.5"
        y="4.5"
        width="3"
        height="5"
        fill={CHART_COLORS.candleUp}
      />
      {/* 음봉 */}
      <line
        x1="13"
        y1="2"
        x2="13"
        y2="13"
        stroke={CHART_COLORS.candleDown}
        strokeWidth="1"
      />
      <rect
        x="11.5"
        y="3.5"
        width="3"
        height="6"
        fill={CHART_COLORS.candleDown}
      />
    </svg>
  );
}
