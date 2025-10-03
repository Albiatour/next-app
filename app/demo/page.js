"use client";
import { useState } from "react";
import Link from "next/link";

export default function Demo() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [slot, setSlot] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !slot) return;
    alert(`Réservation confirmée pour ${name} à ${slot}`);
  };

  const slots = ["12h", "13h", "19h", "20h", "21h"];

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-6">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 text-center">Réserver un créneau</h1>
          <p className="mt-2 text-center text-gray-500">Renseignez vos informations ci-dessous</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Téléphone</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                placeholder="06 12 34 56 78"
              />
            </div>

            <div>
              <label htmlFor="slot" className="block text-sm font-medium text-gray-700">Créneau</label>
              <select
                id="slot"
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="" disabled>Choisir une heure</option>
                {slots.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-white font-medium shadow-md transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Réserver
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-500">← Retour à l’accueil</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
