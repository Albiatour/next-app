"use client"
export const SLOTS = ['12:00','13:00','18:00','19:00','20:00','21:00']
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { InputField, TextareaField } from '../components/InputField.jsx'

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
  const [covers, setCovers] = useState('')
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
    const coversNum = parseInt(String(covers || '').trim(), 10)
    if (!coversNum || coversNum < 1) nextErrors.covers = 'Nombre de couverts requis'
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

  return (
    <main className="min-h-[100svh] w-full bg-zinc-50">
      <style>{`html{scroll-behavior:smooth}.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
      <div className="mx-auto w-full max-w-screen-sm px-4 py-6 md:max-w-screen-md lg:max-w-screen-lg">
        {/* HERO */}
        <section className="text-center mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-zinc-800 mb-2">Réservations IA pour restaurants</h1>
          <p className="text-sm text-zinc-500 mb-6">Prototype Next.js + Vercel — by Alexandre</p>
          <button
            onClick={handleScrollToBooking}
            className="w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 text-white font-medium shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            Réserver
          </button>
        </section>

        {/* BOOKING */}
        <section id="booking" ref={bookingRef} className="mb-8 scroll-mt-20">
          <h2 className="text-xl font-bold text-zinc-800 mb-4">Choisir une date et un créneau</h2>

          <div className="grid gap-x-3 gap-y-4 md:grid-cols-2 md:gap-x-4 md:gap-y-5">
            <div className="space-y-2 md:space-y-2.5">
              <label className="block text-sm font-medium text-zinc-600 mb-1.5">Date</label>
              <DaysScroller
                selected={selectedDate}
                onSelect={(d) => { setSelectedDate(d); setSelectedSlot('') }}
              />
              {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
            </div>

            <div className="space-y-2 md:space-y-2.5">
              <label className="block text-sm font-medium text-zinc-600 mb-1.5">Créneaux disponibles</label>
              <div className="min-h-[48px]">
                {!selectedDate && (
                  <p className="text-sm text-zinc-400">Choisissez d&apos;abord une date</p>
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
                          className={`w-full rounded-full border px-3 py-2 text-sm text-zinc-800 shadow-sm hover:border-zinc-300 transition ${isActive ? 'bg-white border-emerald-500 ring-2 ring-emerald-300' : 'border-zinc-200 bg-white'}`}
                        >
                          {s}
                        </button>
                      )
                    })}
                  </div>
                )}
                {errors.slot && <p className="mt-1 text-xs text-red-600">{errors.slot}</p>}
              </div>
            </div>
          </div>
        </section>

        {/* FORM */}
        <section className="mb-8">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-6 shadow-md space-y-4 md:space-y-5">
            <h3 className="text-lg font-semibold text-zinc-800 mb-4">Vos informations</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-3 gap-y-2 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
              <InputField 
                id="firstName" 
                label="Prénom" 
                required 
                autoComplete="given-name" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                error={errors.firstName} 
              />
              <InputField 
                id="lastName" 
                label="Nom" 
                required 
                autoComplete="family-name" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                error={errors.lastName} 
              />
              <InputField 
                id="email" 
                label="Email" 
                type="email" 
                required 
                autoComplete="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                error={errors.email} 
              />
              <InputField 
                id="phone" 
                label="Téléphone" 
                type="tel" 
                required 
                autoComplete="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                error={errors.phone} 
              />
              <InputField 
                id="covers" 
                label="Nombre de couverts" 
                type="number" 
                required 
                value={covers} 
                onChange={(e) => setCovers(e.target.value)} 
                error={errors.covers} 
              />
              <TextareaField 
                id="comments" 
                label="Commentaires" 
                className="md:col-span-2" 
                value={comments} 
                onChange={(e) => setComments(e.target.value)} 
              />

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-white font-medium shadow-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  Confirmer ma réservation
                </button>
                <p className="mt-2 text-xs text-zinc-500">La date et le créneau sélectionnés seront confirmés à l&apos;étape suivante.</p>
              </div>
            </form>
          </div>
        </section>

        <div className="pb-[env(safe-area-inset-bottom)]" />
      </div>
    </main>
  )
}

// Internal component: horizontal day scroller
function DaysScroller({ selected, onSelect, totalDays = 60 }) {
  const containerRef = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

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
        className="h-9 w-9 rounded-full border border-zinc-300 bg-white disabled:opacity-40"
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
                className={`min-w-[70px] snap-start rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center shadow-sm flex flex-col items-center gap-0.5 ${active ? 'ring-2 ring-emerald-300 border-emerald-300' : ''}`}
              >
                <div className="text-[11px] leading-4 text-zinc-500">{shortDay(d)}</div>
                <div className="text-lg font-bold leading-5 text-zinc-800">{d.getDate()}</div>
                <div className="text-[11px] leading-4 text-zinc-500">{shortMonth(d)}</div>
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
        className="h-9 w-9 rounded-full border border-zinc-300 bg-white disabled:opacity-40"
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
