import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center justify-center gap-8 p-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">AI Report</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        SSR Next.js(App Router) 포트폴리오 프로젝트입니다.
      </p>
      <Link
        href="/reports"
        className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Reports 보기
      </Link>
    </main>
  );
}
