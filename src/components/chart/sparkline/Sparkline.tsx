"use client";

/**
 * Sparkline — 축/눈금/숫자/거래량/크로스헤어 없이 추세선만 표시하는 미니 차트.
 * 업비트 상세 카드 우측의 작은 라인 차트와 동일한 형태.
 * 데이터는 light-chart의 1일(1d) mock을 그대로 재활용한다.
 */

import { useEffect, useRef } from "react";
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  createChart,
  type AreaData,
} from "lightweight-charts";
import { getLightChartMock } from "@/components/chart/light-chart/getLightChartMock";
import { CHART_COLORS } from "@/components/chart/light-chart/lightChartConfig";

export function Sparkline() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        attributionLogo: false, // TradingView 로고 제거
      },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      timeScale: { visible: false, borderVisible: false }, // X축 제거
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: { mode: CrosshairMode.Hidden },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: CHART_COLORS.line,
      lineWidth: 1,
      // 라인 안쪽(영역) 색상 — 위에서 아래로 옅어지는 그라데이션
      topColor: "rgba(221, 60, 68, 0.4)",
      bottomColor: "rgba(221, 60, 68, 0.02)",
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    const { bars } = getLightChartMock("1d");
    const data: AreaData[] = bars.map((b) => ({
      time: b.time,
      value: b.close,
    }));
    series.setData(data);
    chart.timeScale().fitContent();

    const onResize = () => {
      chart.applyOptions({ width: el.clientWidth, height: el.clientHeight });
      chart.timeScale().fitContent();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
    };
  }, []);

  // 차트 캔버스가 모바일 터치를 가로채 부모 Link 클릭을 막으므로 통과시킨다.
  return (
    <div ref={containerRef} className="pointer-events-none h-full w-full" />
  );
}
