import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">404</h1>
      <p className="text-zinc-600">요청한 페이지를 찾을 수 없습니다.</p>
      <Link
        href="/"
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800"
      >
        홈으로
      </Link>
    </div>
  );
}
