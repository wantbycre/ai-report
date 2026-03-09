/**
 * GET 지연(setTimeout) 동안 표시되는 Suspense fallback.
 */
export default function ReportsLoading() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="flex gap-2">
        <div className="h-10 flex-1 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-10 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <ul className="space-y-4">
        {[1, 2, 3].map((i) => (
          <li
            key={i}
            className="h-20 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
          />
        ))}
      </ul>
    </main>
  );
}
