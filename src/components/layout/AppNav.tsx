import Link from "next/link";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "홈" },
  { href: "/reports", label: "Reports" },
] as const;

export function AppNav() {
  return (
    <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-6 px-4">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900",
              "dark:text-zinc-400 dark:hover:text-zinc-100"
            )}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
