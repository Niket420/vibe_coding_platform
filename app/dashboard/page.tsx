import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-14">
          <h1 className="text-5xl font-bold">
            CodeForge
          </h1>

          <p className="mt-4 text-zinc-400 text-lg">
            Start your next coding session
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 hover:border-white transition-all duration-300">

            <div className="text-5xl mb-5">
              ➕
            </div>

            <h2 className="text-2xl font-semibold mb-3">
              Create New Project
            </h2>

            <p className="text-zinc-400 mb-8">
              Create a fresh project using one of our templates.
            </p>

            <Link
              href="/templates"
              className="inline-block rounded-lg bg-white text-black px-5 py-3 font-medium hover:bg-zinc-200"
            >
              Create Project
            </Link>

          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 hover:border-white transition-all duration-300">

            <div className="text-5xl mb-5">
              🐙
            </div>

            <h2 className="text-2xl font-semibold mb-3">
              Import From GitHub
            </h2>

            <p className="text-zinc-400 mb-8">
              Clone an existing GitHub repository into CodeForge.
            </p>

            <button
              className="rounded-lg bg-white text-black px-5 py-3 font-medium hover:bg-zinc-200"
            >
              Import Repository
            </button>

          </div>

        </div>
      </div>
    </main>
  );
}