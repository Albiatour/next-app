"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { InputField, TextareaField } from '../components/InputField.jsx'

// ========== HELPERS : Conversion de dates ==========
// Convertit un objet Date en format européen DD/MM/YYYY
function toEU(date) {
  if (!date) return ''
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// Convertit une date européenne DD/MM/YYYY vers format input YYYY-MM-DD
function fromEUtoInputValue(euDate) {
  if (!euDate || !euDate.includes('/')) return ''
  const [day, month, year] = euDate.split('/')
  return `${year}-${month}-${day}`
}

// Convertit une valeur d'input YYYY-MM-DD vers format européen DD/MM/YYYY
function fromInputValueToEU(inputVal) {
  if (!inputVal || !inputVal.includes('-')) return ''
  const [year, month, day] = inputVal.split('-')
  return `${day}/${month}/${year}`
}

// Génère une clé d'idempotence unique
function genIdemKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback pour navigateurs anciens
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

// Convertit une date européenne DD/MM/YYYY en objet Date (UTC pour éviter problèmes de fuseau)
function euToDate(euDate) {
  if (!euDate || !euDate.includes('/')) return null
  const [day, month, year] = euDate.split('/')
  return new Date(`${year}-${month}-${day}T12:00:00Z`)
}

// Formate un horaire HH:mm en format français (ex: "13:00" -> "13h", "13:30" -> "13h30")
function formatTimeLabel(time) {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  if (minutes === '00') return `${parseInt(hours, 10)}h`
  return `${parseInt(hours, 10)}h${minutes}`
}

// Formate une date au format long français depuis ISO (ex: "2025-10-19" → "19 octobre 2025")
function formatLongFrenchDate(date) {
  if (!date) return ''
  // Si c'est un objet Date, convertir en ISO
  let isoString
  if (date instanceof Date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    isoString = `${y}-${m}-${d}`
  } else {
    isoString = date
  }
  
  // Parser ISO vers Date UTC (évite timezone issues)
  const [year, month, day] = isoString.split('-').map(Number)
  const dt = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(dt)
}

export default function Home() {
  const router = useRouter()
  const bookingRef = useRef(null)

  // ========== RESTAURANT INFO : Pour l'affichage UI uniquement ==========
  const restaurantSlug = process.env.NEXT_PUBLIC_RESTAURANT_SLUG || 'sarrasin'
  const displayName = useMemo(() => {
    return restaurantSlug.charAt(0).toUpperCase() + restaurantSlug.slice(1)
  }, [restaurantSlug])
  
  const ctaLabel = `Réserver une table chez ${displayName}`

  // ========== STATES : Formulaire et réservation ==========
  // Note: selectedDate stocke maintenant un objet Date (pas une string EU)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState('') // ÉTAPE 1 : Créneau sélectionné
  const [selectedSlot, setSelectedSlot] = useState('') // Conservé pour compatibilité
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [covers, setCovers] = useState('1') // Défaut: 1 couvert
  const [comments, setComments] = useState('')
  const [errors, setErrors] = useState({})

  // ========== STATES : Intégration API ==========
  const [bookingLoading, setBookingLoading] = useState(false) // Réservation en cours
  const [confirming, setConfirming] = useState(false) // ÉTAPE 2 : Confirmation en cours
  const [message, setMessage] = useState(null) // {type:'success'|'error', text:string}
  const [confirmation, setConfirmation] = useState(null) // Écran de confirmation après booking réussi

  // ========== FONCTION : Convertir date en ISO ==========
  const dateToISO = (date) => {
    if (!date) return null
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // ========== SWR : Charger les créneaux depuis l'API (toujours frais) ==========
  const selectedDateISO = dateToISO(selectedDate)
  const swrKey = selectedDateISO ? `/api/timeslots?restaurantSlug=${restaurantSlug}` : null
  
  const fetcher = (url) => fetch(url, { cache: 'no-store' }).then(res => res.json())
  
  const { data: apiData, error: apiError, isLoading, mutate } = useSWR(
    swrKey,
    fetcher,
    { 
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 0,
      refreshInterval: 30000 // Auto-refresh toutes les 30s
    }
  )

  // Filtrer et formatter les créneaux pour la date sélectionnée
  const slots = useMemo(() => {
    if (!selectedDateISO || !apiData?.slots) return []
    
    console.log('[Timeslots] Raw API data:', apiData)
    
    // Filtrer pour la date sélectionnée
    const slotsForDate = apiData.slots.filter(slot => {
      if (!slot.start_at) return false
      const slotDate = slot.start_at.split('T')[0]
      return slotDate === selectedDateISO
    })
    
    // Mapper au format UI
    const formatted = slotsForDate.map(slot => ({
      time: slot.time || slot.start_at?.split('T')[1]?.substring(0, 5) || 'N/A',
      capacityLeft: slot.remaining_capacity ?? slot.capacity ?? 0,
      isBookable: (slot.remaining_capacity ?? slot.capacity ?? 0) > 0
    })).filter(s => s.time !== 'N/A')
    
    console.log('[Timeslots] Slots for', selectedDateISO, ':', formatted)
    
    return formatted
  }, [selectedDateISO, apiData])

  const loading = isLoading

  // ========== FONCTION : Réserver un créneau via l'API (ÉTAPE 2) ==========
  const reserve = async (time) => {
    if (!selectedDate || confirming) return
    
    setConfirming(true)
    setMessage(null)
    
    try {
      const dateEU = toEU(selectedDate)
      const partySize = parseInt(covers || '1', 10)
      const customerName = `${firstName.trim()} ${lastName.trim()}`.trim() || 'Client'
      const emailVal = email || 'no-email@example.com'
      const phoneVal = phone || ''
      
      const body = {
        restaurant: 'sarrasin',
        date: dateEU,
        time,
        partySize,
        name: customerName,
        email: emailVal,
        phone: phoneVal,
        comments: comments.trim(),
        idempotencyKey: genIdemKey()
      }
      
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        // Gérer le cas "SLOT_FULL"
        if (data.code === 'SLOT_FULL') {
          setMessage({ type: 'error', text: 'Ce créneau est complet' })
          await mutate() // Recharger pour voir les nouvelles dispo
          return
        }
        // Gérer le cas où le créneau n'existe plus
        if (data.code === 'SLOT_NOT_FOUND' || data.code === 'INVALID_SLOT') {
          setMessage({ type: 'error', text: 'Ce créneau n\'est plus disponible' })
          await mutate() // Recharger pour voir les nouvelles dispo
          return
        }
        throw new Error(data.error || 'Erreur de réservation')
      }
      
      // Succès : Afficher l'écran de confirmation
      const bookingId = data.booking_id || data.bookingId || data.id || 'N/A'
      const bookingCode = data.booking_code || data.bookingCode || ''
      const confirmationName = `${firstName.trim()} ${lastName.trim()}`.trim() || 'Client'
      
      setConfirmation({
        bookingId,
        bookingCode,
        dateEU: toEU(selectedDate),
        time,
        partySize,
        name: confirmationName,
        comments: comments.trim() // Inclure les commentaires s'ils existent
      })
      
      setSelectedSlot(time) // Marquer le créneau sélectionné
      setSelectedTime(time) // Marquer le créneau sélectionné
      await mutate() // Recharger pour voir les nouvelles dispo
      
    } catch (err) {
      console.error('Erreur reserve:', err)
      setMessage({ type: 'error', text: err.message || 'Erreur de réservation' })
    } finally {
      setConfirming(false)
    }
  }

  // ========== FONCTION : Confirmer la réservation (ÉTAPE 2 : Validation + Appel API) ==========
  const handleConfirmReservation = async () => {
    setErrors({})
    
    // Validation : Créneau sélectionné
    if (!selectedTime) {
      setMessage({ type: 'error', text: 'Veuillez d\'abord choisir un créneau' })
      return
    }
    
    // Validation : Formulaire
    const nextErrors = {}
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!firstName || firstName.trim().length < 2) nextErrors.firstName = 'Prénom requis'
    if (!lastName || lastName.trim().length < 2) nextErrors.lastName = 'Nom requis'
    if (!emailPattern.test(email)) nextErrors.email = 'Email invalide'
    if (!phone || phone.trim().length < 8) nextErrors.phone = 'Téléphone invalide'
    const coversNum = parseInt(String(covers || '').trim(), 10)
    if (!coversNum || coversNum < 1) nextErrors.covers = 'Nombre de couverts requis'
    
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setMessage({ type: 'error', text: 'Veuillez compléter tous les champs requis' })
      return
    }
    
    // Tout est OK : réserver
    await reserve(selectedTime)
  }

  // Note: SWR recharge automatiquement quand swrKey change (selectedDateISO)
  // Pas besoin de useEffect manuel

  const isWeekend = (d) => {
    if (!d) return false
    const day = d.getDay() // 0 Sun, 6 Sat
    return day === 0 || day === 6
  }

  // ========== MEMO : Liste des créneaux disponibles (désormais depuis l'API) ==========
  const availableSlots = useMemo(() => {
    if (!selectedDate) return []
    return slots // Utiliser les créneaux de l'API au lieu de SLOTS statiques
  }, [selectedDate, slots])

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

  const handleCoversChange = (e) => {
    const value = e.target.value
    // Ne garder que les chiffres
    const numericValue = value.replace(/[^0-9]/g, '')
    setCovers(numericValue)
    setSelectedTime('') // Réinitialiser le créneau car la capacité change
  }

  // ========== HANDLER : Changement de date (réinitialiser le créneau sélectionné) ==========
  const handleDateChange = (date) => {
    setSelectedDate(date)
    setSelectedTime('') // Réinitialiser le créneau sélectionné
    setSelectedSlot('')
  }

  // ========== HANDLER : Nouvelle réservation (réinitialiser l'écran de confirmation) ==========
  const handleNewReservation = () => {
    setConfirmation(null)
    setMessage(null)
    setSelectedTime('')
    setSelectedSlot('')
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setComments('')
    setErrors({})
    mutate()
  }

  return (
    <main className="min-h-[100svh] w-full bg-zinc-50">
      <style>{`html{scroll-behavior:smooth}.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
      <div className="mx-auto w-full max-w-screen-sm px-4 py-6 md:max-w-screen-md lg:max-w-screen-lg">
        {/* ========== ÉCRAN DE CONFIRMATION (affiché après booking réussi) ========== */}
        {confirmation && (
          <section className="mb-8">
            <div className="rounded-2xl border border-[var(--brand)] bg-white p-6 md:p-8 shadow-lg">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--accent)] mb-4">
                  <span className="text-3xl">✅</span>
                </div>
                <h2 className="text-2xl font-bold text-zinc-800 mb-2">Réservation confirmée !</h2>
                <p className="text-sm text-zinc-500">Votre table est réservée</p>
                <p className="text-sm text-gray-600 mt-3">
                  Votre réservation a bien été enregistrée. Vous recevrez une confirmation par email.
                </p>
                {confirmation.bookingCode && (
                  <p className="text-lg font-mono font-bold text-[var(--brand)] mt-2">
                    {confirmation.bookingCode}
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="rounded-lg bg-zinc-50 px-4 py-3">
                  <p className="text-xs text-zinc-500 mb-1">Date et heure</p>
                  <p className="text-lg font-semibold text-zinc-800">
                    {formatTimeLabel(confirmation.time)} le {formatLongFrenchDate(euToDate(confirmation.dateEU))}
                  </p>
                </div>

                <div className="rounded-lg bg-zinc-50 px-4 py-3">
                  <p className="text-xs text-zinc-500 mb-1">Nom</p>
                  <p className="text-lg font-semibold text-zinc-800">{confirmation.name}</p>
                </div>

                {/* Afficher les commentaires seulement s'ils existent */}
                {confirmation.comments && (
                  <div className="rounded-lg bg-zinc-50 px-4 py-3">
                    <p className="text-xs text-zinc-500 mb-1">Commentaire</p>
                    <p className="text-sm text-zinc-800">{confirmation.comments}</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleNewReservation}
                className="w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-[var(--brand-contrast)] font-medium shadow-md hover:opacity-95 active:opacity-90 focus:outline-none"
              >
                Nouvelle réservation
              </button>
            </div>
          </section>
        )}

        {/* ========== UI NORMALE (masquée si confirmation existe) ========== */}
        {!confirmation && (
          <>
        {/* HERO */}
        <section className="text-center mb-8">
          <button
            onClick={handleScrollToBooking}
            aria-label={ctaLabel}
            title={ctaLabel}
            className="w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-[var(--brand)] px-6 py-3 text-[var(--brand-contrast)] font-medium shadow-md hover:opacity-95 active:opacity-90 focus:outline-none text-balance whitespace-normal text-center"
          >
            {ctaLabel}
          </button>
        </section>

        {/* BOOKING */}
        <section id="booking" ref={bookingRef} className="mb-8 scroll-mt-20">
          <div className="grid gap-x-3 gap-y-4 md:grid-cols-2 md:gap-x-4 md:gap-y-5">
            <div className="space-y-2 md:space-y-2.5">
              <label className="block text-sm font-medium text-zinc-600 mb-1.5">Date</label>
              <DaysScroller
                selected={selectedDate}
                onSelect={handleDateChange}
              />
              {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
            </div>

            <div className="space-y-2 md:space-y-2.5">
              <label className="block text-sm font-medium text-zinc-600 mb-1.5">Créneaux disponibles</label>
              <div className="min-h-[48px]">
                {!selectedDate && (
                  <p className="text-sm text-zinc-400">Choisissez d&apos;abord une date</p>
                )}
                {/* ========== UI : Affichage des créneaux depuis l'API ========== */}
                {selectedDate && loading && (
                  <p className="text-sm text-zinc-400">Chargement des créneaux...</p>
                )}
                {selectedDate && apiError && (
                  <div className="space-y-2">
                    <p className="text-sm text-red-500">Erreur de chargement des créneaux</p>
                    <button
                      type="button"
                      onClick={() => mutate()}
                      className="text-xs text-cyan-700 underline hover:text-cyan-800"
                    >
                      Réessayer
                    </button>
                  </div>
                )}
                {selectedDate && !loading && !apiError && availableSlots.length === 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-400">Aucun créneau disponible pour ce jour.</p>
                    <button
                      type="button"
                      onClick={() => mutate()}
                      className="text-xs text-cyan-700 underline hover:text-cyan-800"
                    >
                      🔄 Actualiser
                    </button>
                  </div>
                )}
                {selectedDate && !loading && availableSlots.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                    {availableSlots.map((s) => {
                      // ========== ÉTAPE 1 : Sélection du créneau (pas de réservation immédiate) ==========
                      // s.time = créneau (ex: "12:00")
                      // s.isBookable = true/false (base)
                      // s.capacityLeft = nombre de places restantes
                      
                      // Nombre de couverts sélectionnés
                      const selectedCovers = parseInt(covers || '1', 10)
                      
                      // Vérification de disponibilité basée sur le nombre de couverts
                      const remainingCapacity = s.capacityLeft || 0
                      const isDisabled = remainingCapacity <= 0 || remainingCapacity < selectedCovers
                      const isSelected = selectedTime === s.time
                      
                      // Label et tooltip
                      const tooltipText = isDisabled
                        ? 'Complet'
                        : `${remainingCapacity} place${remainingCapacity > 1 ? 's' : ''} restante${remainingCapacity > 1 ? 's' : ''}`
                      
                      return (
                        <button
                          key={s.time}
                          type="button"
                          onClick={() => !isDisabled ? setSelectedTime(s.time) : null}
                          disabled={isDisabled}
                          title={tooltipText}
                          className={`w-full rounded-full border px-3 py-2 text-sm shadow-sm transition ${
                            isSelected 
                              ? 'bg-white border-[var(--brand)] ring-2 ring-[var(--brand)] text-zinc-800' 
                              : isDisabled
                                ? 'border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                : 'border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300'
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <span>{s.time}</span>
                            {isDisabled && (
                              <span className="text-[10px] text-red-500">• complet</span>
                            )}
                          </div>
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
            
            {/* ========== MESSAGE D'AIDE : Créneau sélectionné ========== */}
            {selectedTime && (() => {
              const summaryDate = formatLongFrenchDate(selectedDate)
              // Log temporaire de debug
              console.table({
                clickedDate: selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : selectedDate,
                shownDate: summaryDate
              })
              return (
                <div className="rounded-lg bg-[var(--accent)] border border-[var(--brand)] px-4 py-2.5">
                  <p className="text-sm text-[var(--brand)]">
                    Créneau choisi : <strong>{formatTimeLabel(selectedTime)}</strong> le {summaryDate}.
                  </p>
                </div>
              )
            })()}
            <div className="grid grid-cols-1 gap-x-3 gap-y-2 md:grid-cols-2 md:gap-x-4 md:gap-y-3">
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
                min="1"
                max="20"
                step="1"
                pattern="[0-9]+"
                inputMode="numeric"
                value={covers} 
                onChange={handleCoversChange} 
                error={errors.covers} 
              />
              <TextareaField 
                id="comments" 
                label="Commentaires" 
                className="md:col-span-2" 
                value={comments} 
                onChange={(e) => setComments(e.target.value)} 
              />

              {/* ========== BOUTON CONFIRMATION (ÉTAPE 2) ========== */}
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={handleConfirmReservation}
                  disabled={confirming}
                  className="w-full rounded-xl bg-[var(--brand)] px-4 py-3 text-[var(--brand-contrast)] font-medium shadow-md hover:opacity-95 active:opacity-90 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {confirming ? 'Confirmation en cours...' : 'Confirmer ma réservation'}
                </button>
                <p className="mt-2 text-xs text-zinc-500">
                  {selectedTime 
                    ? `Vous allez réserver le créneau de ${selectedTime}.` 
                    : 'Veuillez d\'abord choisir une date et un créneau ci-dessus.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========== ZONE DE MESSAGES : Succès / Erreur ========== */}
        {message && (
          <section className="mb-8">
            <div className={`rounded-xl border px-4 py-3 shadow-sm ${
              message.type === 'success' 
                ? 'bg-[var(--accent)] border-[var(--brand)] text-[var(--brand)]' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          </section>
        )}
        </>
        )}

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
                onClick={() => onSelect(d)}
                role="option"
                aria-selected={active}
                className={`min-w-[70px] snap-start rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center shadow-sm flex flex-col items-center gap-0.5 ${active ? 'ring-2 ring-[var(--brand)] border-[var(--brand)]' : ''}`}
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
