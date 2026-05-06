"use client";

import Link from "next/link";
import Image from "next/image";

const navItems = [
  { href: "/", label: "홈" },
  { href: "/reports", label: "Reports" },
  { href: "/trading-view", label: "트레이딩뷰" },
  { href: "/light-chart", label: "light-chart" },
] as const;

export function AppNav({ title }: { title: string }) {
  return (
    <nav className="mb-0 flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="flex flex-wrap items-center gap-5">
        <Image
          src="/new_logo_light.svg"
          alt="금방금방"
          width={123}
          height={30}
        />
        <span className="text-2xl font-bold underline">({title})</span>
      </h1>
      {/* <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-zinc-600 underline-offset-4 dark:text-zinc-400">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="hover:underline"
          >
            {label}
          </Link>
        ))}
      </div> */}
      <div>
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-600 text-base font-bold text-white shadow"
          aria-label="금"
        >
          금
        </span>
      </div>
      {/* <div className="flex items-center gap-4">
          <Link href="/login">Login</Link>
          <Link href="/signup">Signup</Link>
          <button onClick={handleLogout}>Logout</button>
        </div> */}
    </nav>
  );
}
