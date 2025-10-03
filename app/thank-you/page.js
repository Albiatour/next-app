import Link from 'next/link'

export default function ThankYou({ searchParams }) {
  const name = (searchParams?.name || '').toString()
  const date = (searchParams?.date || '').toString()
  const slot = (searchParams?.slot || '').toString()

  const violet = '#166534'

  return (
    <main className="min-h-[100svh] w-full bg-zinc-50 text-zinc-100 bg-gradient-to-b from-zinc-950 to-zinc-900 flex items-center justify-center px-4 py-6">
      <div className="mx-auto w-full max-w-screen-sm px-0 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Merci {name || '!'} 🎉</h1>
        <p className="mt-4 text-lg text-zinc-300">
          {date && slot
            ? `Votre réservation du ${date} à ${slot} est confirmée.`
            : "Votre réservation est confirmée."
          }
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2"
            style={{ backgroundColor: violet }}
          >
            Nouvelle réservation
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold border border-zinc-700 text-zinc-100 hover:bg-zinc-800 transition"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  )
}


