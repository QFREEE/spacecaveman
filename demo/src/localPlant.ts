import { plantDesigns } from "./plantDesigns";
import { getPlantPalettes, getAllPlantPalettes } from "./plantPalettes";
export const localPlantKey = "spacecaveman:plant:v1";
export type CareId = "rain" | "sun" | "love" | "food";
export type CareStats = Record<CareId, number>;
export type LocalPlant = {
  version: 1;
  plantId: string;
  paletteId: string;
  stats: CareStats;
  careCount: number;
  remainingIds: string[];
};
const plantIds = plantDesigns.map((plant) => plant.id);
function shuffled(ids: readonly string[]): string[] {
  const order = [...ids];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
export function freshPlant(
  plantId?: string,
  remainingIds?: string[],
): LocalPlant {
  const order = shuffled(
    plantId ? plantIds.filter((id) => id !== plantId) : plantIds,
  );
  const selectedId = plantId ?? order.shift()!;
  const palettes = getPlantPalettes(selectedId);
  return {
    version: 1,
    plantId: selectedId,
    paletteId:
      palettes[Math.floor(Math.random() * palettes.length)]?.id ?? "original",
    stats: { rain: 0, sun: 0, love: 0, food: 0 },
    careCount: 0,
    remainingIds: remainingIds ?? order,
  };
}
export function parsePlant(value: string | null): LocalPlant | null {
  try {
    const p = JSON.parse(value ?? "null");
    if (
      !p ||
      p.version !== 1 ||
      !plantDesigns.some((design) => design.id === p.plantId) ||
      !p.stats ||
      !["rain", "sun", "love", "food"].every(
        (key) =>
          Number.isInteger(p.stats[key]) &&
          p.stats[key] >= 0 &&
          p.stats[key] <= 50,
      ) ||
      !Number.isInteger(p.careCount) ||
      p.careCount < 0 ||
      p.careCount > 40
    )
      return null;
    return {
      version: 1,
      plantId: p.plantId,
      // Missing/invalid palette metadata must not discard saved care.
      paletteId: getAllPlantPalettes(p.plantId).some(
        (palette) => palette.id === p.paletteId,
      )
        ? p.paletteId
        : "original",
      stats: {
        rain: p.stats.rain,
        sun: p.stats.sun,
        love: p.stats.love,
        food: p.stats.food,
      },
      careCount: p.careCount,
      // Older saves lack a queue; retain their current plant and care.
      remainingIds:
        Array.isArray(p.remainingIds) &&
        p.remainingIds.every(
          (id: unknown) =>
            typeof id === "string" && plantIds.includes(id) && id !== p.plantId,
        ) &&
        new Set(p.remainingIds).size === p.remainingIds.length
          ? [...p.remainingIds]
          : shuffled(plantIds.filter((id) => id !== p.plantId)),
    };
  } catch {
    return null;
  }
}
export function readLocalPlant(): LocalPlant {
  try {
    return parsePlant(localStorage.getItem(localPlantKey)) ?? freshPlant();
  } catch {
    return freshPlant();
  }
}
export function saveLocalPlant(plant: LocalPlant): void {
  try {
    localStorage.setItem(localPlantKey, JSON.stringify(plant));
  } catch {
    /* Keep this visit interactive when browser storage is unavailable. */
  }
}
export function nextLocalPlant(current: LocalPlant): LocalPlant {
  const order = current.remainingIds.length
    ? [...current.remainingIds]
    : shuffled(plantIds);
  // Keep all designs in the next round, but do not repeat at its boundary.
  if (order[0] === current.plantId && order.length > 1)
    [order[0], order[1]] = [order[1], order[0]];
  return freshPlant(order[0], order.slice(1));
}
