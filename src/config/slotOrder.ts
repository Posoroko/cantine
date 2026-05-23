/**
 * Unified day timeline order covering both planning slots and service slots.
 *
 * Planning slots (prep lists): morning, am, pm, evening, night
 * Service slots (meals):       breakfast, snackAm, lunch, snackPm, supper
 *
 * A planning slot is eligible for a meal if its order is strictly less than
 * the meal's service slot order (i.e. prep happens before the service).
 */
export const DAY_SLOT_ORDER: Record<string, number> = {
    morning:   1,
    breakfast: 2,
    am:        3,
    snackAm:   4,
    lunch:     5,
    pm:        6,
    snackPm:   7,
    supper:    8,
    evening:   9,
    night:     10,
}

export function getSlotOrder(key: string | null | undefined): number {
    if (!key) return -1
    return DAY_SLOT_ORDER[key] ?? -1
}
