import { useState } from "react";
import { createRoot } from "react-dom/client";
import { WatercolorFlower } from "./WatercolorFlower";
import { plantDesigns, getPlantDesign } from "./plantDesigns";
import { getPlantPalettes, getPaletteReference } from "./plantPalettes";
import { en } from "./i18n/en";
import { zh } from "./i18n/zh";
import "./styles/plant-preview.css";

const stages = [
  { name: "Seed", stats: { rain: 0, sun: 0, love: 0, food: 0 } },
  { name: "Sprout", stats: { rain: 8, sun: 0, love: 0, food: 0 } },
  { name: "Ink", stats: { rain: 50, sun: 0, love: 0, food: 0 } },
  { name: "Leaves", stats: { rain: 50, sun: 50, love: 50, food: 0 } },
  { name: "Watercolor", stats: { rain: 50, sun: 50, love: 50, food: 50 } },
];
function PlantPreview() {
  const [stage, setStage] = useState(4);
  const [selection, setSelection] = useState(() =>
    new URLSearchParams(window.location.search).get("view") === "all"
      ? "all"
      : "featured",
  );
  const [care, setCare] = useState<number | null>(null);
  const plants = plantDesigns.filter(
    (plant) =>
      selection === "all" ||
      (selection === "featured"
        ? ["rose", "iris", "hydrangea"].includes(plant.id)
        : selection === plant.id),
  );
  const values =
    care === null
      ? null
      : [
          [0, 6],
          [6, 4],
          [10, 3],
          [13, 5],
        ].map(([offset, steps]) =>
          Math.round(Math.max(0, Math.min(50, ((care - offset) * 50) / steps))),
        );
  const stats = values
    ? { rain: values[0], sun: values[1], love: values[2], food: values[3] }
    : stages[stage].stats;
  return (
    <main>
      <header>
        <p className="eyebrow">THE LITTLE GARDEN / NATURAL COLOR STUDIES</p>
        <h1>
          {selection === "all"
            ? "花朵配色总览 · 29 款"
            : "Same seed. A different bloom."}
        </h1>
        <p className="intro">
          Thirteen plants, 29 distinct palettes. Original reference numbers stay
          fixed; gaps mark retired colors.
        </p>
        <nav aria-label="Preview controls">
          <div aria-label="Growth stage">
            {stages.map((item, index) => (
              <button
                key={item.name}
                aria-pressed={care === null && index === stage}
                onClick={() => {
                  setStage(index);
                  setCare(null);
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
          <label className="plant-select">
            Plants{" "}
            <select
              value={selection}
              onChange={(event) => setSelection(event.target.value)}
            >
              <option value="featured">Rose, iris & hydrangea</option>
              {plantDesigns.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.id === "lily-of-the-valley"
                    ? "Lily of the valley / Bluebell"
                    : en[plant.name]}
                </option>
              ))}
              <option value="all">All plants</option>
            </select>
          </label>
        </nav>
        <div className="grow-controls">
          <button onClick={() => setCare(0)}>Start from seed</button>
          <button
            disabled={care === null || care >= 18}
            onClick={() => setCare((value) => Math.min(18, (value ?? 0) + 1))}
          >
            Add a little care
          </button>
          <span role="status">
            {care === null
              ? "Compare finished colors or choose a growth stage."
              : care === 18
                ? "In full bloom."
                : "Care added: " + care + " / 18"}
          </span>
        </div>
      </header>
      <section className="plant-gallery" aria-label="Natural plant palettes">
        {plants.flatMap((plant) =>
          getPlantPalettes(plant.id).map((palette) => {
            const design = getPlantDesign(plant.id, palette.id);
            return (
              <article
                key={plant.id + palette.id}
                data-reference={getPaletteReference(plant.id, palette.id)}
              >
                <span className="palette-number">
                  {getPaletteReference(plant.id, palette.id)}
                </span>
                <WatercolorFlower
                  plantId={plant.id}
                  paletteId={palette.id}
                  stats={stats}
                />
                <h2>
                  {palette.name} {en[design.name].toLowerCase()}
                </h2>
                <p className="chinese-name">{zh[design.name]}</p>
                <div className="swatches" aria-label="Leaf and flower colors">
                  {[
                    ...new Set(
                      [...design.leaves, ...design.flowers].map(
                        (mark) => mark.color,
                      ),
                    ),
                  ].map((color) => (
                    <span
                      key={color}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </article>
            );
          }),
        )}
      </section>
      <footer>
        Natural colors, familiar ink outlines <span>•</span>{" "}
        <a href="/">Try the garden →</a>
      </footer>
    </main>
  );
}
if (import.meta.env.DEV)
  createRoot(document.getElementById("root")!).render(<PlantPreview />);
