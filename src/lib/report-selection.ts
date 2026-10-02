import type { Classroom, UnitSummary } from "./api/types";

export function defaultClass(classes: Classroom[], requestedId?: string | null) {
  return classes.find(item => item.id === requestedId) ?? classes.find(item => item.isActive) ?? classes[0] ?? null;
}
export function orderedUnits(units: UnitSummary[]) {
  return [...units].sort((a, b) => a.order - b.order);
}
export function defaultUnit(units: UnitSummary[], requestedId?: string | null) {
  return units.find(item => item.id === requestedId) ?? orderedUnits(units).at(-1) ?? null;
}
