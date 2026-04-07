"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { supabaseClient } from "@/lib/supabase/client";
import Image from "next/image";

const navItems = [
  { href: "/", label: "홈" },
  { href: "/reports", label: "Reports" },
  { href: "/trading-view", label: "트레이딩뷰" },
] as const;

export function AppNav() {
  const handleLogout = async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) alert(error.message);
  };

  return (
    <nav className="flex items-center justify-between py-4 mb-0">
      <h1>
        <Image
          src="/new_logo_light.svg"
          alt="금방금방"
          width={123}
          height={30}
        />
      </h1>
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
