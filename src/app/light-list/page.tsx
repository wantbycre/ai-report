"use client";

import { AppNav } from "@/components/layout/AppNav";
import Image from "next/image";

export default function LightChartSamplePage() {
  return (
    <main>
      <AppNav />

      <div>
        <Image
          src="/kb.png"
          alt="kb-logo"
          width={0}
          height={0}
          style={{ width: "100%", height: "auto" }}
          sizes="100vw"
          priority
        />
      </div>
    </main>
  );
}
