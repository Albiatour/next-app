"use client"
export const SLOTS = ['12:00','13:00','18:00','19:00','20:00','21:00']
import { useEffect, useMemo, useRef, useState } from 'react'
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

  const violet = '#166534'

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-900">
      <style>{`html{scroll-behavior:smooth}.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
      {/* HERO */}
      <section className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">Réservations IA pour restaurants</h1>
          <p className="mt-4 text-lg text-gray-600">Prototype Next.js + Vercel — by Alexandre</p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={handleScrollToBooking}
              className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2"
              style={{ backgroundColor: violet }}
            >
              Réserver
            </button>
          </div>
        </div>
      </section>

      {/* BOOKING */}
      <section id="booking" ref={bookingRef} className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl sm:text-3xl font-bold">Choisir une date et un créneau</h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <span className="block text-sm font-medium text-gray-800">Date</span>
              <div className="mt-2">
                <DaysScroller
                  selected={selectedDate}
                  onSelect={(d) => { setSelectedDate(d); setSelectedSlot('') }}
                />
              </div>
              {errors.date && <p className="mt-2 text-sm text-red-600">{errors.date}</p>}
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-800">Créneaux disponibles</span>
              <div className="mt-2 min-h-[48px]">
                {!selectedDate && (
                  <p className="text-gray-500">Choisissez d&apos;abord une date</p>
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
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-emerald-700 border-emerald-600 text-white' : 'bg-transparent border-gray-300 text-gray-800 hover:bg-gray-100'}`}
                        >
                          {s}
                        </button>
                      )
                    })}
                  </div>
                )}
                {errors.slot && <p className="mt-2 text-sm text-red-600">{errors.slot}</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white border border-gray-200 p-8 shadow-xl">
          <h3 className="text-xl font-semibold text-gray-900">Vos informations</h3>
          <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Prénom</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600"
                placeholder="Alexandre"
              />
              {errors.firstName && <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Nom</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600"
                placeholder="Dupont"
              />
              {errors.lastName && <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600"
                placeholder="vous@example.com"
              />
              {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Téléphone</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600"
                placeholder="06 12 34 56 78"
              />
              {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700">Commentaires</label>
              <textarea
                id="comments"
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500"
                placeholder="Allergies, préférences, nombre de personnes, etc."
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full rounded-xl px-6 py-3 text-base font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2"
                style={{ backgroundColor: violet }}
              >
                Confirmer ma réservation
              </button>
              <p className="mt-2 text-sm text-gray-600">La date et le créneau sélectionnés seront confirmés à l&apos;étape suivante.</p>
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
  const violet = '#166534'

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
        className={`rounded-full border px-3 py-2 ${canLeft ? 'text-gray-700 border-gray-300 bg-white hover:bg-gray-100' : 'text-gray-400 border-gray-200 bg-white opacity-60 cursor-not-allowed'}`}
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
              className={`snap-start shrink-0 rounded-xl border px-4 py-2 text-center min-w-[72px] ${active ? 'bg-emerald-700 border-emerald-600 text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200'}`}
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
        className={`rounded-full border px-3 py-2 ${canRight ? 'text-gray-700 border-gray-300 bg-white hover:bg-gray-100' : 'text-gray-400 border-gray-200 bg-white opacity-60 cursor-not-allowed'}`}
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
