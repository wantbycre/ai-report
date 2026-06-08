import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center justify-center gap-8 p-6 text-center">
      <Link
        href="/light-list"
        className="rounded-md bg-zinc-900 px-5 py-2.5 text-lg font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        lightweight-list
      </Link>
    </main>
  );
}
