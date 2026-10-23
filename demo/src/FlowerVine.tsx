import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./Language";
import { ModuleFrame } from "./ModuleFrame";
import { WatercolorFlower } from "./WatercolorFlower";
import {
  readLocalPlant,
  saveLocalPlant,
  nextLocalPlant,
  type LocalPlant,
} from "./localPlant";

const actions = [
  {
    id: "rain",
    label: "flower.care.water",
    stat: "flower.stat.rain",
    icon: "♧",
    effect: "﹅ ﹅ ﹅",
  },
  {
    id: "sun",
    label: "flower.care.sun",
    stat: "flower.stat.sun",
    icon: "☼",
    effect: "☼",
  },
  {
    id: "love",
    label: "flower.care.prune",
    stat: "flower.stat.love",
    icon: "✂",
    effect: "✂",
  },
  {
    id: "food",
    label: "flower.care.feed",
    stat: "flower.stat.food",
    icon: "⋄",
    effect: "✧ · ✧",
  },
] as const;
type Care = (typeof actions)[number];
function ScissorsIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ verticalAlign: "-2px" }}
    >
      <circle cx="5" cy="5" r="2.8" />
      <circle cx="5" cy="17" r="2.8" />
      <path d="M7.2 6.8 19 19M7.2 15.2 19 3" />
      <circle cx="11" cy="11" r=".65" />
    </svg>
  );
}
function FertilizerBagIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width="15"
      height="17"
      viewBox="0 0 20 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{
        width: size,
        height: size * 1.1,
        marginTop: 0,
        verticalAlign: "-3px",
      }}
    >
      <path d="M6 6 5 2q5 1 10 0l-1 4M6 6q-2 4-3 11-.5 3 7 3t7-3q-1-7-3-11M5.5 6q4.5 1 9 0" />
      <path d="M10 17v-5m0 2q-4 0-4-3 4 0 4 3m0-1q0-4 4-4 0 4-4 4M7 17h6" />
    </svg>
  );
}

export function FlowerVine() {
  const { t } = useLanguage();
  const [plant, setPlant] = useState(readLocalPlant);
  const current = useRef(plant);
  const [active, setActive] = useState<Care | null>(null);
  const [effectId, setEffectId] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    saveLocalPlant(current.current);
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function commit(next: LocalPlant) {
    current.current = next;
    setPlant(next);
    saveLocalPlant(next);
  }
  function care(action: Care) {
    const before = current.current;
    if (before.stats[action.id] >= 50) return;
    const completed = Object.values(before.stats).filter(
      (value) => value === 50,
    ).length;
    const steps = [6, 4, 3, 5][completed];
    const nextValue = Math.round(
      ((Math.round((before.stats[action.id] * steps) / 50) + 1) * 50) / steps,
    );
    commit({
      ...before,
      stats: {
        ...before.stats,
        [action.id]: Math.min(50, nextValue),
      },
      careCount: Math.min(32, before.careCount + 1),
    });
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (timer.current) clearTimeout(timer.current);
      setActive(action);
      setEffectId((id) => id + 1);
      timer.current = setTimeout(() => {
        setActive(null);
        timer.current = null;
      }, 650);
    }
  }
  function newPlant() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setActive(null);
    commit(nextLocalPlant(current.current));
  }
  return (
    <ModuleFrame
      id="flower"
      title={t("flower.title")}
      english=""
      icon="flower"
      className="flower"
    >
      <div
        className="flower-stage"
        data-stage={Math.floor(
          Object.values(plant.stats).reduce((sum, n) => sum + n, 0) / 25,
        )}
        data-care={active?.id ?? "idle"}
      >
        <WatercolorFlower stats={plant.stats} plantId={plant.plantId} />
        {active ? (
          <span
            className={`care-effect effect-${active.id}`}
            key={effectId}
            aria-hidden="true"
          >
            {active.id === "food" ? (
              <FertilizerBagIcon size={28} />
            ) : active.id === "love" ? (
              <ScissorsIcon size={28} />
            ) : (
              active.effect
            )}
          </span>
        ) : null}
      </div>
      <div
        className="plant-meters"
        data-recognition={plant.careCount >= 10 ? "thanks" : undefined}
      >
        {actions.map((action) => (
          <div className="plant-stat" key={action.id}>
            <span>{t(action.stat)}</span>
            <meter
              aria-label={t(action.stat)}
              min="0"
              max="50"
              value={plant.stats[action.id]}
            />
          </div>
        ))}
      </div>
      <div className="care-actions">
        {actions.map((action) => (
          <button
            key={action.id}
            className="bevel"
            type="button"
            onClick={() => care(action)}
          >
            <span aria-hidden="true">
              {action.id === "food" ? (
                <FertilizerBagIcon />
              ) : action.id === "love" ? (
                <ScissorsIcon />
              ) : (
                action.icon
              )}{" "}
            </span>
            {t(action.label)}
          </button>
        ))}
      </div>
      <div className="plant-tools">
        <button type="button" className="text-button" onClick={newPlant}>
          {t("flower.newPlant")}
        </button>
      </div>
    </ModuleFrame>
  );
}
