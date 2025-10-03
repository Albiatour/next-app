"use client"
export const SLOTS = ['12:00','13:00','18:00','19:00','20:00','21:00']
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const bookingRef = useRef(null)

  // Form and booking state
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [comments, setComments] = useState('')
  const [errors, setErrors] = useState({})

  // Smooth scrolling + hide scrollbar utilities
  // Injected once per mount
  useEffect(() => {
    // no-op; style tag is rendered in JSX below
  }, [])

  const isWeekend = (d) => {
    if (!d) return false
    const day = d.getDay() // 0 Sun, 6 Sat
    return day === 0 || day === 6
  }

  const availableSlots = useMemo(() => {
    if (!selectedDate) return []
    return SLOTS
  }, [selectedDate])

  const handleScrollToBooking = () => {
    const el = bookingRef.current
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const validate = () => {
    const nextErrors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!firstName || firstName.trim().length < 2) nextErrors.firstName = 'Prénom trop court'
    if (!lastName || lastName.trim().length < 2) nextErrors.lastName = 'Nom trop court'
    if (!emailPattern.test(email)) nextErrors.email = 'Email invalide'
    if (!phone || phone.trim().length < 8) nextErrors.phone = 'Téléphone invalide'
    if (!selectedDate) nextErrors.date = 'Date requise'
    if (!selectedSlot) nextErrors.slot = 'Créneau requis'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
    const dateStr = selectedDate ? isoDate(selectedDate) : ''
    const url = `/thank-you?name=${encodeURIComponent(fullName)}&date=${encodeURIComponent(dateStr)}&slot=${encodeURIComponent(selectedSlot)}`
    router.push(url)
  }

  const violet = '#9b87f5'

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 text-white">
      <style>{`html{scroll-behavior:smooth}.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
      {/* HERO */}
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">Réservations IA pour restaurants</h1>
          <p className="mt-4 text-lg text-gray-300">Prototype Next.js + Vercel — by Alexandre</p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={handleScrollToBooking}
              className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold shadow-lg transition focus:outline-none focus:ring-2"
              style={{ backgroundColor: violet }}
            >
              Réserver
            </button>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold border border-white/20 text-white hover:bg-white/5 transition"
            >
              Voir la démo
            </Link>
          </div>
        </div>
      </section>

      {/* BOOKING */}
      <section id="booking" ref={bookingRef} className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl sm:text-3xl font-bold">Choisir une date et un créneau</h2>
          <p className="mt-2 text-gray-300">Semaine: 12:00–13:00 & 19:00–20:00 · Week-end: 19:00–21:00</p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <span className="block text-sm font-medium text-gray-300">Date</span>
              <div className="mt-2">
                <DaysScroller
                  selected={selectedDate}
                  onSelect={(d) => { setSelectedDate(d); setSelectedSlot('') }}
                />
              </div>
              {errors.date && <p className="mt-2 text-sm text-red-400">{errors.date}</p>}
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-300">Créneaux disponibles</span>
              <div className="mt-2 min-h-[48px]">
                {!selectedDate && (
                  <p className="text-gray-400">Choisissez d&apos;abord une date</p>
                )}
                {selectedDate && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableSlots.map((s) => {
                      const isActive = selectedSlot === s
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedSlot(s)}
                          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-violet-600 border-violet-500 text-white' : 'bg-transparent border-white/15 text-white hover:bg-white/5'}`}
                        >
                          {s}
                        </button>
                      )
                    })}
                  </div>
                )}
                {errors.slot && <p className="mt-2 text-sm text-red-400">{errors.slot}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white/5 border border-white/10 p-8 shadow-xl">
          <h3 className="text-xl font-semibold">Vos informations</h3>
          <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">Prénom</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/40 outline-none focus:ring-2"
                placeholder="Alexandre"
              />
              {errors.firstName && <p className="mt-2 text-sm text-red-400">{errors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">Nom</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/40 outline-none focus:ring-2"
                placeholder="Dupont"
              />
              {errors.lastName && <p className="mt-2 text-sm text-red-400">{errors.lastName}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/40 outline-none focus:ring-2"
                placeholder="vous@example.com"
              />
              {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300">Téléphone</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/40 outline-none focus:ring-2"
                placeholder="06 12 34 56 78"
              />
              {errors.phone && <p className="mt-2 text-sm text-red-400">{errors.phone}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="comments" className="block text-sm font-medium text-gray-300">Commentaires</label>
              <textarea
                id="comments"
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/40 outline-none focus:ring-2"
                placeholder="Allergies, préférences, nombre de personnes, etc."
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full rounded-xl px-6 py-3 text-base font-semibold shadow-lg transition focus:outline-none focus:ring-2"
                style={{ backgroundColor: violet }}
              >
                Confirmer ma réservation
              </button>
              <p className="mt-2 text-sm text-gray-400">La date et le créneau sélectionnés seront confirmés à l&apos;étape suivante.</p>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}

// Internal component: horizontal day scroller
function DaysScroller({ selected, onSelect, totalDays = 60 }) {
  const containerRef = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)
  const violet = '#9b87f5'

  const days = useMemo(() => {
    const arr = []
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    for (let i = 0; i < totalDays; i += 1) {
      const d = new Date(now)
      d.setDate(now.getDate() + i)
      arr.push(d)
    }
    return arr
  }, [totalDays])

  const shortDay = (d) => {
    const days = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']
    return days[d.getDay()]
  }

  const shortMonth = (d) => {
    const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
    return months[d.getMonth()]
  }

  const updateScrollState = () => {
    const el = containerRef.current
    if (!el) return
    const atStart = el.scrollLeft <= 0
    const atEnd = Math.ceil(el.scrollLeft + el.clientWidth) >= el.scrollWidth
    setCanLeft(!atStart)
    setCanRight(!atEnd)
  }

  useEffect(() => {
    updateScrollState()
  }, [])

  const scrollByPage = (direction) => {
    const el = containerRef.current
    if (!el) return
    const amount = el.clientWidth * 0.9
    el.scrollBy({ left: direction * amount, behavior: 'smooth' })
    // schedule an update after scroll begins
    setTimeout(updateScrollState, 250)
  }

  const isSameDay = (a, b) => {
    if (!a || !b) return false
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Précédent"
        onClick={() => scrollByPage(-1)}
        disabled={!canLeft}
        className={`rounded-full border px-3 py-2 text-white ${canLeft ? 'border-white/20 bg-white/5 hover:bg-white/10' : 'border-white/10 bg-white/5 opacity-40 cursor-not-allowed'}`}
      >
        ←
      </button>
      <div
        ref={containerRef}
        onScroll={updateScrollState}
        className="no-scrollbar flex gap-2 overflow-x-auto snap-x snap-mandatory flex-1"
      >
        {days.map((d) => {
          const active = isSameDay(selected, d)
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onSelect(new Date(d))}
              className={`snap-start shrink-0 rounded-xl border px-4 py-2 text-center min-w-[72px] ${active ? 'bg-violet-600 border-violet-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800'}`}
              style={{ outlineColor: violet }}
            >
              <div className="text-[11px] leading-4">{shortDay(d)}</div>
              <div className="text-lg font-semibold leading-5">{d.getDate()}</div>
              <div className="text-[11px] leading-4 opacity-90">{shortMonth(d)}</div>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        aria-label="Suivant"
        onClick={() => scrollByPage(1)}
        disabled={!canRight}
        className={`rounded-full border px-3 py-2 text-white ${canRight ? 'border-white/20 bg-white/5 hover:bg-white/10' : 'border-white/10 bg-white/5 opacity-40 cursor-not-allowed'}`}
      >
        →
      </button>
    </div>
  )
}

// Helpers
function isoDate(d) {
  return d.toISOString().slice(0, 10)
}
