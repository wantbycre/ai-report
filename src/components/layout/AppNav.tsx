"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkline } from "@/components/chart/sparkline/Sparkline";
import { RefreshCcwIcon } from "lucide-react";

export function AppNav() {
  const pathname = usePathname();
  const isLightChart = pathname === "/light-chart";

  return (
    <nav className="pt-3 px-4 bg-white">
      {isLightChart ? (
        <div className="flex justify-between">
          <Link href="/light-list">
            <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 ">
              <svg
                width="30"
                height="30"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M9.75 3.22a.75.75 0 0 1 0 1.06L6.06 8l3.69 3.72a.75.75 0 0 1-1.06 1.06l-4.22-4.25a.75.75 0 0 1 0-1.06l4.22-4.25a.75.75 0 0 1 1.06 0z" />
              </svg>
            </span>
          </Link>
          <div>
            {/* 새로고침 아이콘 */}
            <RefreshCcwIcon className="w-4 h-4" />
          </div>
        </div>
      ) : null}
      <div className="flex justify-between">
        <div>
          <h1 className="flex flex-wrap items-center gap-5 mb-3">
            {/* <Image
            src="/new_logo_light.svg"
            alt="금방금방"
            width={123}
            height={30}
          /> */}
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-600 text-base font-bold text-white shadow"
              aria-label="금"
            >
              금
            </span>
          </h1>
          <section
            className={`mb-3 font-tahoma text-2xl font-bold text-red-500`}
          >
            <div className="mb-1 leading-5">
              220,000
              <span className="text-xs">/1g</span>
            </div>
            <div className="flex items-center gap-2 text-xs leading-3">
              <span>▲ 2,300</span>
              <span>(1.23%)</span>
            </div>
          </section>
        </div>

        <Link
          href="/light-chart"
          aria-label="차트 상세로 이동"
          className="block h-[70px] w-[180px] bg-gray-50 mt-1"
        >
          <Sparkline />
        </Link>
      </div>
    </nav>
  );
}
