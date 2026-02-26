export default function Loading() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="h-8 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
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
