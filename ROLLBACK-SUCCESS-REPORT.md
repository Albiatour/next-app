# ✅ ROLLBACK PROD RÉUSSI

**Date** : 15 octobre 2025  
**Méthode utilisée** : PLAN A (reset dur + force push sécurisé)  
**Commit cible** : `5d6c49e` (majjjjjj)  
**Status** : ✅ **SUCCÈS**

---

## 📊 État actuel du repository

### Branche principale (main)
```
Hash actuel : 5d6c49eb9717d723853bc76c86724be783d35ca6
Commit      : 5d6c49e majjjjjj
Tag créé    : stable-mono-resto-2025-10-15
```

### Vérification
```bash
$ git rev-parse origin/main
5d6c49eb9717d723853bc76c86724be783d35ca6

$ git show --no-patch --oneline origin/main
5d6c49e majjjjjj

$ git tag -l
stable-mono-resto-2025-10-15
```

---

## 🔄 Actions effectuées

1. ✅ **Pre-check Git** : Commit 5d6c49e vérifié (existe localement)
2. ✅ **Checkout main** : Basculé sur la branche main
3. ✅ **Pull rebase** : Synchronisé avec origin/main
4. ✅ **Reset hard** : `git reset --hard 5d6c49e`
5. ✅ **Force push sécurisé** : `git push --force-with-lease origin main`
   - Résultat : `d3a48df...5d6c49e main -> main (forced update)`
6. ✅ **Tag créé** : `stable-mono-resto-2025-10-15`
7. ✅ **Tag pushé** : Visible sur GitHub

---

## 🎯 Version stable restaurée

### Caractéristiques de la version 5d6c49e :

**Frontend (`app/page.js`)** :
- Format date : **DD/MM/YYYY** (européen)
- Paramètre API : `restaurant: 'sarrasin'` (hardcodé)
- Appel API : `/api/availability?restaurant=sarrasin&date=16/10/2025&partySize=2`

**API (`app/api/availability/route.js`)** :
- Paramètre requis : `restaurant` (via query string)
- Format date accepté : DD/MM/YYYY ou YYYY-MM-DD
- Filtre Airtable : `AND({restaurant_slug}='sarrasin', IS_SAME({date_iso}, 'YYYY-MM-DD', 'day'), {is_open}=1)`
- Retour : Objets `{ time, capacityLeft, isBookable }`

**Configuration** :
- ✅ Version **mono-restaurant** (Sarrasin uniquement)
- ✅ Pas de dépendance à `RESTAURANT_SLUG` env var
- ✅ Utilise `capacity_total` et `capacity_used` (pas `remaining_capacity`)

---

## 🚀 Déploiement Vercel

Le push sur `main` a automatiquement déclenché le déploiement Vercel.

### Vérifications à effectuer :

#### 1️⃣ Instance **Sarrasin** (devrait fonctionner ✅)

**Test API** :
```
https://votre-sarrasin.vercel.app/api/availability?restaurant=sarrasin&date=30/12/2025&partySize=2
```

**Résultat attendu** :
```json
{
  "restaurant": "sarrasin",
  "date": "2025-12-30",
  "partySize": 2,
  "slots": [
    {
      "time": "12:00",
      "capacityLeft": 30,
      "isBookable": true
    },
    ...
  ]
}
```

**Test UI** :
1. Ouvrir `https://votre-sarrasin.vercel.app/`
2. Sélectionner une date dans le calendrier
3. ✅ **Les créneaux doivent s'afficher**
4. Cliquer sur un créneau → Remplir le formulaire → Réserver
5. ✅ **La confirmation doit apparaître**

---

#### 2️⃣ Instance **Bistro** (ne fonctionnera PAS ❌)

**Raison** : Cette version est mono-restaurant avec `restaurant: 'sarrasin'` hardcodé dans le code.

**Test API** :
```
https://votre-bistro.vercel.app/api/availability?restaurant=bistro&date=16/10/2025&partySize=2
```

**Résultat attendu** :
- ✅ L'API devrait fonctionner SI les données Airtable existent avec `restaurant_slug='bistro'`
- ❌ Le front NE fonctionnera PAS car il envoie `restaurant=sarrasin` en dur

**Note** : C'est normal et attendu. Cette version stable est mono-restaurant.

---

## 📝 Commits supprimés (rollback)

Les commits suivants ont été supprimés de `main` :

```
d3a48df - chore(debug): add /api/debug-env; harden /api/availability
83b9f1e - fix(env): use RESTAURANT_SLUG for API routes
d3400cf - debug(api): add detailed logs to availability endpoint
f0ede18 - fix(api): read NEXT_PUBLIC_RESTAURANT_SLUG env
eae7e83 - rollback: restore stable mono-resto (5d6c49e)
```

**Total** : 5 commits supprimés de l'historique main

---

## ⚠️ Problèmes identifiés dans les versions supprimées

Les modifications multi-instances ont introduit plusieurs bugs :

1. **Changement de filtre Airtable** : `{remaining_capacity} > 0` au lieu de `capacity_total - capacity_used`
   - ❌ Champ `remaining_capacity` n'existe pas dans Airtable
   
2. **Changement de format de date** : YYYY-MM-DD au lieu de DD/MM/YYYY
   - ❌ Incompatibilité avec le front qui envoie DD/MM/YYYY

3. **Changement de format de réponse** : Array de strings au lieu d'objets
   - ❌ Le front attend `{ time, capacityLeft, isBookable }`

4. **Suppression du paramètre partySize** : Plus pris en compte dans le filtre
   - ❌ Affiche tous les créneaux même si capacité insuffisante

**Leçon** : Trop de changements simultanés sans tests intermédiaires.

---

## 🔮 Prochaines étapes recommandées

Pour supporter Bistro (multi-instances) :

1. **Analyser la version stable** :
   - Comprendre exactement comment elle fonctionne
   - Identifier tous les points de modification nécessaires

2. **Créer une branche de développement** :
   ```bash
   git checkout -b feat/multi-restaurant
   ```

3. **Modifications progressives** :
   - ✅ Étape 1 : Remplacer `restaurant: 'sarrasin'` par env var (côté client uniquement)
   - ✅ Tester : Sarrasin doit toujours fonctionner
   - ✅ Étape 2 : Adapter l'API pour lire env var côté serveur
   - ✅ Tester : API doit toujours retourner les mêmes données
   - ✅ Étape 3 : Déployer sur Bistro
   - ✅ Tester : Bistro doit afficher ses créneaux

4. **NE PAS** :
   - ❌ Changer le format de date
   - ❌ Changer le format de réponse API
   - ❌ Changer le filtre Airtable (sauf si nécessaire ET testé)
   - ❌ Faire plusieurs modifications en même temps

5. **Tests requis à chaque étape** :
   - Sarrasin local → Sarrasin prod → Bistro local → Bistro prod

---

## 🏁 Conclusion

✅ **Rollback réussi**  
✅ **Main pointe sur 5d6c49e**  
✅ **Tag stable-mono-resto-2025-10-15 créé**  
✅ **Déploiement Vercel déclenché automatiquement**  

**Prochaine action** : Tester l'instance Sarrasin sur Vercel pour confirmer que les créneaux s'affichent.

---

**Report généré le** : 15 octobre 2025  
**Commit stable** : `5d6c49eb9717d723853bc76c86724be783d35ca6`  
**Tag** : `stable-mono-resto-2025-10-15`

