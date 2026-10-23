export type PlantPalette = {
  id: string;
  name: string;
  flowers: readonly string[];
  leaves: readonly string[];
  center?: string;
  accents?: Readonly<Record<number, string>>;
};
const green = ["#456f39", "#6e8b43"];
const sage = ["#5c7550", "#7f925f"];
const deepGreen = ["#426b42", "#6b8b4d"];
const ivory = ["#ddd8cc", "#aaa495"];
const blush = ["#efb0b7", "#d77d93"];
const apricot = ["#f3bd81", "#e58c60"];
const crimson = ["#bb3549", "#de5b64"];
const purple = ["#81458e", "#ac70b2"];
const blue = ["#6d80c6", "#a6b5e0"];
const gold = ["#edb83e", "#f5cf53"];
function palette(
  id: string,
  name: string,
  flowers: readonly string[],
  leaves = green,
  extras: Pick<PlantPalette, "center" | "accents"> = {},
): PlantPalette {
  return { id, name, flowers, leaves, ...extras };
}
// Colors are selected together, rather than randomizing individual petals.
export const plantPalettes: Readonly<Record<string, readonly PlantPalette[]>> =
  {
    cosmos: [
      palette("pink", "Rose pink", ["#e34287", "#f47faa"], sage),
      palette(
        "white",
        "Original warm mix",
        ["#f18b65", "#ed6688", "#ed685b", "#f29d7c", "#ee736a"],
        ["#739a70", "#a4ab58", "#8da58a"],
        { center: "#d8ad50" },
      ),
      palette("wine", "Deep rose", ["#a83b66", "#cc6688"], deepGreen),
    ],
    tulip: [
      palette("red", "Cherry red", crimson, sage),
      palette("yellow", "Golden yellow", gold, green),
      palette("purple", "Purple", purple, sage),
    ],
    sunflower: [
      palette("gold", "Golden", gold, green, { center: "#b87318" }),
      palette("lemon", "Lemon", ["#f0d979", "#e1bd49"], sage, {
        center: "#b87318",
      }),
      palette("russet", "Russet", ["#b65a37", "#df8c46"], deepGreen, {
        center: "#843e1b",
      }),
    ],
    poppy: [
      palette("scarlet", "Scarlet", crimson, sage, { center: "#635047" }),
      palette("coral", "Coral", ["#f05b50", "#fa946b"], sage, {
        center: "#635047",
      }),
      palette("white", "Tangerine", ["#f4a04a", "#df6c31"], green, {
        center: "#635047",
      }),
    ],
    lavender: [
      palette("lavender", "Lavender", ["#a18bc4", "#8064a9"], sage),
      palette("violet", "Deep violet", purple, sage),
      palette("white", "Rosy lilac", ["#b88acb", "#9664b0"], sage),
    ],
    calla: [
      palette("white", "Deep apricot", ["#dc793b", "#b9572e"], deepGreen, {
        accents: { 2: "#edb83e" },
      }),
      palette("yellow", "Golden yellow", gold, green, {
        accents: { 2: "#d8ad50" },
      }),
      palette("rose", "Rose", ["#ef6997", "#cf3c78"], deepGreen, {
        accents: { 2: "#edb83e" },
      }),
    ],
    rose: [
      palette("blush", "Blush", blush, green),
      palette("apricot", "Apricot", apricot, green),
      palette("crimson", "Crimson", crimson, deepGreen),
    ],
    daisy: [
      palette("white", "Golden yellow", gold, green, {
        center: "#edb83e",
      }),
      palette("cream", "Cream", ivory, sage, { center: "#edb83e" }),
      palette("pink", "Blush pink", blush, green, { center: "#edb83e" }),
    ],
    iris: [
      palette("blue", "Blue-violet", blue, sage, { accents: { 6: "#edb83e" } }),
      palette("purple", "Purple", purple, green, { accents: { 6: "#edb83e" } }),
      palette("cream", "Golden apricot", ["#efc065", "#d78b40"], sage, {
        accents: { 6: "#edb83e" },
      }),
    ],
    daffodil: [
      palette("gold", "Golden", gold, green, {
        accents: { 6: "#f39a35", 7: "#e97b39" },
      }),
      palette("ivory", "Lemon & gold", ["#f0d979", "#e1bd49"], sage, {
        accents: { 6: "#edb83e", 7: "#f39a35" },
      }),
      palette("peach", "Butter yellow & peach", ["#eac56d", "#d7ad51"], green, {
        accents: { 6: "#f3bd81", 7: "#e58c60" },
      }),
    ],
    hydrangea: [
      palette("blue", "Soft blue", ["#7ca4d7", "#aac5e4"], green),
      palette("pink", "Pink", blush, green),
      palette("lavender", "Lavender", ["#a18bc4", "#c2acd8"], deepGreen),
    ],
    "lily-of-the-valley": [
      palette("white", "Rose pink", ["#df98ac", "#c96f91"], deepGreen),
      palette("ivory", "Deep blue", ["#3448ac", "#5264cc"], green),
      palette("blush", "Pale blush", ["#f1d3d5", "#dfb0bf"], deepGreen),
    ],
  };
// Keep the review IDs and saved colors available after retiring near duplicates.
const references = new Map(
  Object.entries(plantPalettes)
    .flatMap(([plantId, palettes]) =>
      palettes.map((palette) => plantId + ":" + palette.id),
    )
    .map((id, index) => [id, String(index + 1).padStart(2, "0")]),
);
const retiredReferences = new Set(["08", "14", "15", "29", "30", "36"]);
export function getPaletteReference(
  plantId: string,
  paletteId: string,
): string {
  return references.get(plantId + ":" + paletteId) ?? "";
}
export function getAllPlantPalettes(id: string): readonly PlantPalette[] {
  return plantPalettes[id] ?? [];
}
export function getPlantPalettes(id: string): readonly PlantPalette[] {
  return getAllPlantPalettes(id).filter(
    (palette) => !retiredReferences.has(getPaletteReference(id, palette.id)),
  );
}
