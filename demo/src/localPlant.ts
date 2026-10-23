import { getPlantDesign, plantDesigns } from "./plantDesigns";
export const localPlantKey = "spacecaveman:plant:v1";
export type CareId = "rain" | "sun" | "love" | "food";
export type CareStats = Record<CareId, number>;
export type LocalPlant = {
  version: 1;
  plantId: string;
  stats: CareStats;
  careCount: number;
};
export function freshPlant(plantId = plantDesigns[0].id): LocalPlant {
  return {
    version: 1,
    plantId,
    stats: { rain: 0, sun: 0, love: 0, food: 0 },
    careCount: 0,
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
      stats: {
        rain: p.stats.rain,
        sun: p.stats.sun,
        love: p.stats.love,
        food: p.stats.food,
      },
      careCount: p.careCount,
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
  const index = plantDesigns.indexOf(getPlantDesign(current.plantId));
  return freshPlant(plantDesigns[(index + 1) % plantDesigns.length].id);
}
