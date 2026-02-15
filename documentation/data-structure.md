# Cantinification - Data Structure

## Overview

Application pour gérer la restauration d'événements (festivals, mariages, etc.)
Planification des repas sur plusieurs jours avec listes de préparation.

**Naming Conventions:**
- Collections: `snake_case`
- Fields: `camelCase`
- Relations: `recipe.ingredients` (not `recipe.ingredients_id`)
- User fields: `user` (not `directus_users_id`)

---

## Collections

### 1. `diets` (Régimes alimentaires)
Régimes alimentaires utilisés partout (dropdown).

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| name | string | Name (vegan, veggie, halal, etc.) |
| color | string | Color for UI (hex) |
| icon | string | Icon name (optional) |

---

### 2. `units` (Unités de mesure)
Unités de mesure pour les ingrédients.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| name | string | Name (kg, L, unit, bunch, etc.) |
| abbreviation | string | Short form (kg, L, u, etc.) |
| type | string | Type: 'weight', 'volume', 'count' |

---

### 2. `suppliers` (Fournisseurs)
Fournisseurs d'ingrédients.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| name | string | Supplier name |
| contact | string | Contact person |
| phone | string | Phone |
| email | string | Email |
| address | text | Address |
| notes | text | Notes |

---

### 3. `ingredients` (Ingrédients)
Ingrédients de base pour les recettes.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| name | string | Ingredient name |
| unit | M2O → units | Default unit |
| category | string | Category (vegetables, meats, spices, etc.) |
| diet | M2O → diets | Diet type (vegan, veggie, meat, halal, etc.) |
| notes | text | Notes |
| suppliedFrom | M2O → suppliers | Currently selected supplier |
| stock | decimal | Current stock quantity |

**Relations:**
- `supplyOptions` → O2M vers `ingredient_suppliers`
- `suppliedFrom` → M2O vers `suppliers`

---

### 4. `ingredient_suppliers` (Options de fournisseurs)
Junction table: ingredients ↔ suppliers with pricing.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| ingredient | M2O → ingredients | Ingredient |
| supplier | M2O → suppliers | Supplier |
| price | decimal | Unit price |
| priceUnit | string | Price unit (per kg, per case, etc.) |
| notes | text | Notes (packaging, minimum order, etc.) |

---

### 5. `recipes` (Recettes - Livre de recettes)
Recettes de base pour un nombre standard de convives (ex: 100).

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| name | string | Recipe name |
| description | text | Description |
| baseServings | integer | Base serving count (default: 100) |
| category | string | Category (starter, main, dessert, etc.) |
| prepTime | integer | Prep time (minutes) |
| cookTime | integer | Cook time (minutes) |
| instructions | text | Cooking instructions |
| notes | text | Notes |

**Relations:**
- `ingredients` → O2M vers `recipe_ingredients`

---

### 6. `recipe_ingredients` (Ingrédients de recette - base)
Ingrédients pour la recette de base (ex: pour 100 convives).

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| recipe | M2O → recipes | Recipe |
| ingredient | M2O → ingredients | Ingredient |
| quantity | decimal | Quantity (for baseServings) |
| unit | M2O → units | Unit |
| notes | string | Notes (diced, minced, etc.) |

---

### 7. `meals` (Repas - instances adaptées)
Instance d'une recette adaptée pour un service.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| service | M2O → services | Parent service |
| recipe | M2O → recipes | Source recipe |
| guestCount | integer | Main guest count |
| notes | text | Notes/adjustments |

**Relations:**
- `ingredients` → O2M vers `meal_ingredients`
- `dietCounts` → O2M vers `meal_diet_counts`

**Calculation:**
`meal_ingredient.quantity = recipe_ingredient.quantity × (meal.guestCount / recipe.baseServings)`

---

### 8. `meal_diet_counts` (Comptages par régime)
Nombre de convives par régime pour un repas.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| meal | M2O → meals | Parent meal |
| diet | M2O → diets | Diet type |
| guestCount | integer | Guest count for this diet |
| notes | string | Notes |

---

### 9. `meal_ingredients` (Ingrédients de repas - calculés)
Ingrédients calculés/ajustés pour le repas réel.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| meal | M2O → meals | Parent meal |
| ingredient | M2O → ingredients | Ingredient |
| quantity | decimal | Calculated/adjusted quantity |
| unit | M2O → units | Unit |
| adjusted | boolean | Manually adjusted? |
| notes | text | Notes |

---

### 10. `guests` (Invités spéciaux)
Invités avec besoins spéciaux (allergies, régimes).

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| name | string | Guest name |
| diet | M2O → diets | Diet type |
| allergies | text | Allergies (free text) |
| event | M2O → events | Linked to entire event (optional) |
| day | M2O → days | Linked to specific day (optional) |
| meal | M2O → meals | Linked to specific meal (optional) |
| notes | text | Notes |

---

### 11. `crew` (Équipe)
Membres de l'équipe.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| user | M2O → directus_users | Linked Directus user (optional) |
| name | string | Name |
| phone | string | Phone |
| email | string | Email |
| role | string | Role (chef, commis, helper, etc.) |
| notes | text | Notes |

---

### 12. `missions` (Missions/Tâches)
Tâches de préparation (templates réutilisables).

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| name | string | Task name (grate cheese, peel potatoes) |
| description | text | Detailed description |
| duration | integer | Estimated duration (minutes) |
| category | string | Category (cutting, cooking, shopping, etc.) |
| prep | M2O → ingredients | Ingredient to prep (if prep task) |
| cook | M2O → recipes | Recipe to cook (if cooking task) |

---

### 13. `events` (Événements)
Événements principaux (festival, mariage, etc.)

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| name | string | Event name |
| client | string | Client/Organizer |
| location | string | Location |
| startDate | date | Start date |
| endDate | date | End date |
| guestCount | integer | Estimated guest count |
| notes | text | Notes |
| status | string | Status: draft, confirmed, completed, cancelled |

**Relations:**
- `days` → O2M vers `days`

---

### 14. `days` (Jours)
Jours individuels d'un événement.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| event | M2O → events | Parent event |
| date | date | Date |
| guestCount | integer | Guest count (override) |
| notes | text | Day notes |
| prep | M2O → day_preps | Day's prep schedule |
| menu | M2O → day_menus | Day's menu |

---

### 15. `day_preps` (Planning préparation)
Planning des préparations pour une journée.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| day | O2O → days | Parent day |
| notes | text | General notes |

**Relations (O2M to `day_prep_slots`):**
- `morning` → prep slots for morning
- `am` → prep slots for late morning
- `pm` → prep slots for afternoon
- `evening` → prep slots for evening
- `night` → prep slots for night

---

### 16. `day_prep_slots` (Créneaux de préparation)
Missions assignées à un créneau de préparation.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| dayPrep | M2O → day_preps | Parent day prep |
| slot | string | Slot: morning, am, pm, evening, night |
| mission | M2O → missions | Mission to do |
| crew | M2O → crew | Assigned crew member |
| quantity | decimal | Quantity (if applicable) |
| unit | M2O → units | Unit |
| completed | boolean | Done? |
| notes | text | Notes |

---

### 17. `day_menus` (Menu du jour)
Menu des repas pour une journée.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| day | O2O → days | Parent day |
| breakfast | M2O → services | Petit-déjeuner |
| amSnack | M2O → services | Collation 10h |
| lunch | M2O → services | Midi |
| pmSnack | M2O → services | Goûter |
| supper | M2O → services | Souper |
| nightSnack | M2O → services | Midnight snack |
| notes | text | General notes |

---

### 18. `services` (Services de repas)
Un service de repas contenant plusieurs plats.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| name | string | Service name (optional) |
| time | time | Main service time (ex: 12:00) |
| guestCount | integer | Guest count for main time |
| guestType | string | Guest type: artists, staff, crew, all |
| notes | text | Notes |

**Relations:**
- `meals` → O2M vers `meals`
- `customTimes` → O2M vers `service_times`

---

### 19. `service_times` (Horaires personnalisés)
Horaires alternatifs pour un service (ex: artistes à 11h30).

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| service | M2O → services | Parent service |
| time | time | Custom time (ex: 11:30) |
| guestCount | integer | Guest count for this time |
| guestType | string | Guest type: artists, staff, crew |
| notes | string | Notes (ex: "départ soundcheck") |

---

### 7. `meals` (Repas - instances adaptées)
Instance d'une recette adaptée pour un service.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| service | M2O → services | Parent service |
| recipe | M2O → recipes | Source recipe |
| guestCount | integer | Actual guest count (can override service) |
| notes | text | Notes/adjustments |

**Relations:**
- `ingredients` → O2M vers `meal_ingredients`

**Calculation:**
`meal_ingredient.quantity = recipe_ingredient.quantity × (meal.guestCount / recipe.baseServings)`

---

## Diagramme des relations

```
┌─────────────┐
│   events    │
└──────┬──────┘
       │ O2M
       ▼
┌─────────────┐
│    days     │
└──────┬──────┘
       │
       ├─── M2O ───▶ ┌─────────────┐      ┌──────────────────┐
       │             │  day_preps  │─O2M─▶│  day_prep_slots  │
       │             └─────────────┘      └────────┬─────────┘
       │                                           │
       │                                    M2O    │    M2O
       │                                    ┌──────┴──────┐
       │                                    ▼             ▼
       │                             ┌──────────┐   ┌─────────┐
       │                             │ missions │   │  crew   │
       │                             └────┬─────┘   └─────────┘
       │                                  │
       │                           M2O    │    M2O
       │                           ┌──────┴──────┐
       │                           ▼             ▼
       │                    ┌─────────────┐  ┌─────────┐
       │                    │ ingredients │  │ recipes │
       │                    └──────┬──────┘  └────┬────┘
       │                           │              │
       │                           │         O2M  │
       │                           │              ▼
       │                           │    ┌───────────────────┐
       │                           │    │ recipe_ingredients│
       │                           │    └─────────┬─────────┘
       │                           │              │ M2O
       │                           ◀──────────────┘
       │
       └─── M2O ───▶ ┌─────────────┐      ┌──────────────────┐
                     │  day_menus  │─O2M─▶│  day_menu_items  │
                     └─────────────┘      └────────┬─────────┘
                                                   │ M2O
                                                   ▼
                                            ┌─────────┐
                                            │ recipes │
                                            └─────────┘

┌─────────────┐      ┌───────────────────────┐      ┌─────────────┐
│ ingredients │─O2M─▶│  ingredient_suppliers │◀─M2O─│  suppliers  │
└─────────────┘      └───────────────────────┘      └─────────────┘
       │
       │ M2O (suppliedFrom)
       ▼
┌─────────────┐
│  suppliers  │
└─────────────┘

┌─────────────┐
│    units    │◀─── M2O from ingredients, recipe_ingredients, day_prep_slots
└─────────────┘
```

---

## Flux d'utilisation

### Créer un événement
1. Créer `event` (name, dates, location, guestCount)
2. Ajouter des `days` à l'événement
3. Chaque day crée automatiquement un `day_prep` et un `day_menu`

### Planifier les préparations d'un jour
1. Ouvrir `day.prep` (day_preps)
2. Ajouter des `day_prep_slots` pour chaque créneau (morning, am, pm, etc.)
3. Chaque slot: sélectionner une mission, assigner un crew member

### Planifier le menu d'un jour
1. Ouvrir `day.menu` (day_menus)
2. Ajouter des `day_menu_items` pour chaque repas
3. Chaque item: sélectionner une recette, définir le nombre de portions, type de convives

### Créer une recette
1. Créer `recipe`
2. Ajouter des `recipe_ingredients` avec quantités

### Gérer les fournisseurs
1. Créer des `suppliers`
2. Pour chaque `ingredient`, créer des `ingredient_suppliers` avec prix
3. Sélectionner le fournisseur actif via `suppliedFrom`

---

## Slots & Meals Reference

### Prep Slots (day_prep_slots.slot)
| Value | Français |
|-------|----------|
| morning | Matin |
| am | Avant-midi |
| pm | Après-midi |
| evening | Soirée |
| night | Nuit |

### Meal Types (day_menu_items.meal)
| Value | Français |
|-------|----------|
| breakfast | Petit-déjeuner |
| amSnack | Collation 10h |
| lunch | Midi |
| pmSnack | Goûter |
| supper | Souper |
| nightSnack | Midnight Snack |

### Guest Types (day_menu_items.guestType)
| Value | Français |
|-------|----------|
| artists | Artistes |
| staff | Staff |
| crew | Équipe |
| all | Tous |

---

## Notes

- **Costs**: Calculated in the app, not in Directus
- **Inventory**: Managed via `ingredients.stock` field, UI in app
- **Categories**: Free text fields for now, can add collections later if needed
