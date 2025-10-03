import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Réservations IA pour restaurants
        </h1>
        <p className="mt-4 text-lg text-gray-300">
          Prototype Next.js + Vercel — by Alexandre
        </p>
        <div className="mt-8">
          <Link
            href="/demo"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-6 py-3 text-base font-medium text-white shadow-lg transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Voir la démo
          </Link>
        </div>
      </div>
    </main>
  )
}
