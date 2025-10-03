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
    <main className="min-h-[100svh] w-full bg-zinc-50 text-zinc-100 bg-gradient-to-b from-zinc-950 to-zinc-900">
      <style>{`html{scroll-behavior:smooth}.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
      {/* HERO */}
      <section className="px-4 py-10">
        <div className="mx-auto w-full max-w-screen-sm px-0 py-0 md:max-w-screen-md lg:max-w-screen-lg text-center">
          <h1 className="text-2xl font-bold md:text-4xl">Réservations IA pour restaurants</h1>
          <p className="mt-3 text-sm text-zinc-300 md:text-base">Prototype Next.js + Vercel — by Alexandre</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={handleScrollToBooking}
              className="w-full md:w-auto inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2"
              style={{ backgroundColor: violet }}
            >
              Réserver
            </button>
          </div>
        </div>
      </section>

      {/* BOOKING */}
      <section id="booking" ref={bookingRef} className="px-4 py-10 scroll-mt-20 md:scroll-mt-24">
        <div className="mx-auto w-full max-w-screen-sm px-0 md:max-w-screen-md lg:max-w-screen-lg">
          <h2 className="text-xl font-bold md:text-2xl">Choisir une date et un créneau</h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <span className="block text-sm font-medium text-zinc-200">Date</span>
              <div className="mt-2">
                <DaysScroller
                  selected={selectedDate}
                  onSelect={(d) => { setSelectedDate(d); setSelectedSlot('') }}
                />
              </div>
              {errors.date && <p className="mt-2 text-sm text-red-400">{errors.date}</p>}
            </div>

            <div>
              <span className="block text-sm font-medium text-zinc-200">Créneaux disponibles</span>
              <div className="mt-2 min-h-[48px]">
                {!selectedDate && (
                  <p className="text-zinc-400">Choisissez d&apos;abord une date</p>
                )}
                {selectedDate && (
                  <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                    {availableSlots.map((s) => {
                      const isActive = selectedSlot === s
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedSlot(s)}
                          className={`w-full rounded-full border px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-emerald-700 border-emerald-600 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:border-zinc-500'}`}
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
      <section className="px-4 pb-24">
        <div className="mx-auto w-full max-w-screen-sm px-0 md:max-w-screen-md lg:max-w-screen-lg rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 md:p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-zinc-100 md:text-xl">Vos informations</h3>
          <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-zinc-200">Prénom</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder-zinc-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600"
                placeholder="Alexandre"
              />
              {errors.firstName && <p className="mt-2 text-sm text-red-400">{errors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-zinc-200">Nom</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder-zinc-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600"
                placeholder="Dupont"
              />
              {errors.lastName && <p className="mt-2 text-sm text-red-400">{errors.lastName}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-200">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder-zinc-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600"
                placeholder="vous@example.com"
              />
              {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-zinc-200">Téléphone</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder-zinc-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600"
                placeholder="06 12 34 56 78"
              />
              {errors.phone && <p className="mt-2 text-sm text-red-400">{errors.phone}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="comments" className="block text-sm font-medium text-zinc-200">Commentaires</label>
              <textarea
                id="comments"
                rows={4}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-100 placeholder-zinc-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600"
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
              <p className="mt-2 text-sm text-zinc-400">La date et le créneau sélectionnés seront confirmés à l&apos;étape suivante.</p>
            </div>
          </form>
        </div>
      </section>
      <div className="pb-[env(safe-area-inset-bottom)]" />
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
    <div className="grid grid-cols-[auto,1fr,auto] items-center gap-2 w-full">
      <button
        type="button"
        aria-label="Précédent"
        onClick={() => scrollByPage(-1)}
        disabled={!canLeft}
        className="h-9 w-9 rounded-full border border-zinc-700 disabled:opacity-40"
      >
        ←
      </button>
      <div
        ref={containerRef}
        onScroll={updateScrollState}
        role="listbox"
        className="no-scrollbar overflow-x-auto snap-x snap-mandatory w-full"
      >
        <div className="flex gap-2">
          {days.map((d) => {
            const active = isSameDay(selected, d)
            return (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => onSelect(new Date(d))}
                role="option"
                aria-selected={active}
                className={`snap-start shrink-0 min-w-[68px] px-2 py-2 rounded-xl border text-center flex flex-col gap-0.5 ${active ? 'bg-emerald-700 border-emerald-600 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-100'}`}
                style={{ outlineColor: violet }}
              >
                <div className="text-[11px] leading-4">{shortDay(d)}</div>
                <div className="text-xl font-bold leading-5">{d.getDate()}</div>
                <div className="text-[11px] leading-4 opacity-90">{shortMonth(d)}</div>
              </button>
            )
          })}
        </div>
      </div>
      <button
        type="button"
        aria-label="Suivant"
        onClick={() => scrollByPage(1)}
        disabled={!canRight}
        className="h-9 w-9 rounded-full border border-zinc-700 disabled:opacity-40"
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
