import Link from "next/link";
export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold">
          CodeForge
        </h1>

        <p className="text-zinc-400 text-lg">
          Browser IDE with AI-powered vibe coding.
        </p>

        <Link
  href="/dashboard"
  className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-zinc-200 transition"
>
  Get Started
</Link>
      </div>
    </main>
  );
}