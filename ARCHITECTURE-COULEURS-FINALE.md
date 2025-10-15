# Architecture Couleurs Finale - Styles Inline + Cache Désactivé

## 📊 État Actuel

| Fichier | Type | Cache | Couleurs |
|---------|------|-------|----------|
| `app/layout.js` | Server Component | N/A | Minimal (pas de fetch) |
| `app/page.js` | **Client Component** | `cache: 'no-store'` | Styles inline `BG`/`TXT` |
| `/api/restaurant` | API Route | `force-dynamic` + `revalidate: 0` | Retourne `brand_hex` |
| `/api/availability` | API Route | `force-dynamic` | Créneaux |
| `/api/book` | API Route | `force-dynamic` | Réservations |

---

## ⚠️ Limitation Architecturale

### Pourquoi il y a un Flash Blanc

**Problème** : `app/page.js` est un **Client Component** (`"use client"`).

**Raison** : Utilise des hooks React :
- `useState` (10+ états : selectedDate, firstName, email, etc.)
- `useEffect` (fetch restaurant, loadAvailability)
- `useRef` (bookingRef, containerRef)
- `useRouter` (navigation)

**Conséquence** : 
1. Le HTML initial est rendu **sans** les données `restaurant`
2. Le JavaScript charge → `useEffect` → `fetch /api/restaurant`
3. Données arrivent → `setRestaurant(data)`
4. Re-render avec couleurs `BG` et `TXT`

**Délai inévitable** : ~100-500ms selon la connexion

---

## 🎯 Solutions Possibles

### Option 1 : Accepter le Flash (Actuel) ✅

**État actuel** :
- ✅ Cache désactivé partout (`no-store`, `force-dynamic`)
- ✅ Couleurs inline dès que restaurant charge
- ✅ Code simple et maintenable

**Flash** : ~100-500ms au chargement initial

---

### Option 2 : Server Components (Refonte Majeure) ❌

**Requis** :
1. Extraire toute la logique formulaire vers des Client Components séparés
2. Créer un Server Component parent qui fetch restaurant en SSR
3. Passer les données via props aux Client Components
4. Refactor complet de `app/page.js` (~700 lignes)

**Avantage** : Zéro flash (HTML initial a déjà les couleurs)

**Inconvénient** : Refonte complète nécessaire

---

### Option 3 : Streaming SSR avec Suspense (Complexe) ⚠️

**Code** :
```jsx
// app/page.js (Server Component)
export default async function Page() {
  const restaurant = await getRestaurant(slug)
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BookingClient restaurant={restaurant} />
    </Suspense>
  )
}

// BookingClient.jsx (Client Component)
export default function BookingClient({ restaurant }) {
  // Tout le code actuel, sans fetch restaurant
  const BG = hexToRgbCss(restaurant.brand_hex)
  // ...
}
```

**Avantage** : Pas de flash, data SSR

**Inconvénient** : Refactoring nécessaire

---

## ✅ Optimisations Actuelles

### 1️⃣ Cache Désactivé Partout

**API Routes** (`/api/restaurant`, `/api/availability`, `/api/book`) :
```js
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

**Fetch Client** :
```js
fetch('/api/restaurant?slug=...', {
  cache: 'no-store'
})
```

**Résultat** : Data toujours fraîche, MAJ sans redéploiement ✅

---

### 2️⃣ Styles Inline Immédiatement

```js
const BG = brandHex && /^#([0-9a-fA-F]{6})$/.test(brandHex) 
  ? hexToRgbCss(brandHex) 
  : null

// Appliqué dès que BG est défini
<button style={BG ? { backgroundColor: BG, color: TXT } : undefined}>
```

**Résultat** : Couleur appliquée dès `setRestaurant(data)` ✅

---

### 3️⃣ Aucune Classe Verte Hardcodée

```bash
$ grep -r "emerald-\|green-\|bg-blue-" app/ components/
# ✅ 0 résultats (sauf backups)
```

---

## 📝 État du Code

### `app/page.js` (Client Component)

**Flux de chargement** :
```
1. Mount → useEffect déclenché
2. fetch('/api/restaurant?slug=bistro')
3. Response → setRestaurant(data)
4. BG calculé → style inline appliqué
5. Re-render avec couleurs ✅
```

**Délai** : ~100-500ms (inévitable en Client Component)

---

### `/api/restaurant/route.js`

```js
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Mock Airtable
const mockRestaurants = {
  bistro: { brand_hex: '#7F4F24' },    // Brun
  sarrasin: { brand_hex: '#0E7490' }   // Cyan
}

console.log('THEME', slug, restaurant.brand_hex)
```

**Performance** : ~50ms (mock local)

---

## 🔧 Configuration Vercel

### Variables d'Environnement

**Projet Bistro** :
```
NEXT_PUBLIC_RESTAURANT_SLUG=bistro
```

**Projet Sarrasin** :
```
NEXT_PUBLIC_RESTAURANT_SLUG=sarrasin
```

---

## 🧪 Tests

### Test 1 : Vérifier Data Fraîche

1. Modifier `brand_hex` dans `/api/restaurant/route.js`
2. Rafraîchir (F5)
3. ✅ Nouvelle couleur appliquée immédiatement

### Test 2 : Vérifier Cache Désactivé

1. DevTools → Network → Disable cache
2. Rafraîchir plusieurs fois
3. ✅ Chaque requête fetch les data (pas de cache)

### Test 3 : Mesurer le Flash

1. DevTools → Network → Slow 3G
2. Rafraîchir
3. Observer : Flash blanc ~300-500ms (normal pour Client Component)

---

## 🚀 Commande

```bash
npm run dev
```

---

## 📈 Pour Éliminer le Flash Complètement

**Solution recommandée** : Refactorer vers Server Components

**Étapes** :
1. Créer `app/BookingClient.jsx` (Client Component avec tous les hooks)
2. Transformer `app/page.js` en Server Component
3. Fetch restaurant en SSR
4. Passer données via props

**Code exemple** :

```jsx
// app/page.js (Server Component - pas de "use client")
import BookingClient from './BookingClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getRestaurant(slug) {
  const res = await fetch(`http://localhost:3000/api/restaurant?slug=${slug}`, {
    cache: 'no-store'
  })
  return await res.json()
}

export default async function Page() {
  const slug = process.env.NEXT_PUBLIC_RESTAURANT_SLUG || 'bistro'
  const restaurant = await getRestaurant(slug)
  
  // Validation brand_hex
  if (!/^#([0-9a-fA-F]{6})$/.test(restaurant?.brand_hex || '')) {
    throw new Error(`brand_hex invalide pour ${slug}: "${restaurant?.brand_hex}"`)
  }
  
  return <BookingClient restaurant={restaurant} />
}
```

```jsx
// app/BookingClient.jsx (Client Component)
"use client"
export default function BookingClient({ restaurant }) {
  // Tous les useState, useEffect, etc.
  const BG = hexToRgbCss(restaurant.brand_hex)
  const TXT = isDarkHex(restaurant.brand_hex) ? 'white' : 'black'
  
  // Plus besoin de fetch restaurant (déjà passé en props)
  // ...
}
```

**Résultat** : HTML initial a déjà `BG` et `TXT` → Zéro flash ✅

---

## ✅ Conclusion

**État actuel** : Optimal pour Client Component
- ✅ Cache désactivé
- ✅ Styles inline
- ✅ Data fraîche
- ⚠️ Flash ~100-500ms (inévitable)

**Pour zéro flash** : Refactorer vers Server Components (effort significatif)

---

**Documentation** : `ARCHITECTURE-COULEURS-FINALE.md`

