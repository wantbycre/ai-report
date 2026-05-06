"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/spinner";
import type { TickerInfo } from "@/components/chart/GoldChart";

const LightChartFixedSample = dynamic(
  () => import("@/components/chart/LightChartFixedSample"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-900/40">
        <Spinner />
      </div>
    ),
  },
);

interface Props {
  onTick?: (ticker: TickerInfo) => void;
}

export default function ChartDemoClient({ onTick }: Props) {
  return <LightChartFixedSample onTick={onTick} />;
}
