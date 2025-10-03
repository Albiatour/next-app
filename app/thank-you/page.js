import Link from 'next/link'

export default function ThankYou({ searchParams }) {
  const name = (searchParams?.name || '').toString()
  const date = (searchParams?.date || '').toString()
  const slot = (searchParams?.slot || '').toString()

  const violet = '#9b87f5'

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white flex items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Merci {name || '!'} 🎉</h1>
        <p className="mt-4 text-lg text-gray-300">
          {date && slot
            ? `Votre réservation du ${date} à ${slot} est confirmée.`
            : "Votre réservation est confirmée."
          }
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold shadow-lg transition focus:outline-none focus:ring-2"
            style={{ backgroundColor: violet }}
          >
            Nouvelle réservation
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold border border-white/20 text-white hover:bg-white/5 transition"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </main>
  )
}


