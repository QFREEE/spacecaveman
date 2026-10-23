import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./Language";
import type { MessageKey } from "./i18n/en";
import { ModuleFrame } from "./ModuleFrame";
import { WatercolorFlower } from "./WatercolorFlower";

const actions = [
  {
    id: "rain",
    label: "flower.care.water",
    stat: "flower.stat.rain",
    icon: "♧",
    effect: "﹅ ﹅ ﹅",
    response: "flower.notice.watered",
  },
  {
    id: "sun",
    label: "flower.care.sun",
    stat: "flower.stat.sun",
    icon: "☼",
    effect: "☼",
    response: "flower.notice.sunAdded",
  },
  {
    id: "love",
    label: "flower.care.prune",
    stat: "flower.stat.love",
    icon: "✂",
    effect: "✂",
    response: "flower.notice.pruned",
  },
  {
    id: "food",
    label: "flower.care.feed",
    stat: "flower.stat.food",
    icon: "⋄",
    effect: "✧ · ✧",
    response: "flower.notice.fed",
  },
] as const;
type Care = (typeof actions)[number];
type Stats = Record<Care["id"], number>;
type Plant = {
  stats: Stats;
  log: string[];
  generation: number;
  bloomed_at: string | null;
  error?: string;
};
const initialStats = { rain: 0, sun: 0, love: 0, food: 0 };
const careStep = 5;

function previewStats(stats: Stats, queue: readonly Care[]): Stats {
  const next = { ...stats };
  for (const action of queue)
    next[action.id] = Math.min(50, next[action.id] + careStep);
  return next;
}

async function requestPlant(
  care?: Care["id"],
): Promise<{ plant: Plant; status: number }> {
  const response = await fetch(`/api/flower${care ? `?care=${care}` : ""}`, {
    method: care ? "POST" : "GET",
    signal: AbortSignal.timeout(10000),
  });
  if (![200, 409, 429].includes(response.status))
    throw new Error("Flower unavailable");
  const plant = await response.json();
  if (
    !plant.stats ||
    !actions.every(
      ({ id }) =>
        Number.isInteger(plant.stats[id]) &&
        plant.stats[id] >= 0 &&
        plant.stats[id] <= 50,
    ) ||
    !Array.isArray(plant.log) ||
    plant.log.length > 12 ||
    !plant.log.every((id: unknown) =>
      actions.some((action) => action.id === id),
    ) ||
    !Number.isSafeInteger(plant.generation) ||
    plant.generation < 1 ||
    !(
      plant.bloomed_at === null ||
      (typeof plant.bloomed_at === "string" &&
        Number.isFinite(Date.parse(plant.bloomed_at)))
    )
  ) {
    throw new Error("Invalid flower");
  }
  return { plant, status: response.status };
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
  const [stats, setStats] = useState(initialStats);
  const [active, setActive] = useState<Care | null>(null);
  const [notice, setNotice] = useState<MessageKey | "">("");
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const [contribution, setContribution] = useState({ generation: 0, count: 0 });
  const [effectId, setEffectId] = useState(0);
  const [queued, setQueued] = useState<Care[]>([]);
  const queue = useRef<Care[]>([]);
  const confirmed = useRef(initialStats);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const revision = useRef(0);
  const plantGeneration = useRef(0);
  const mounted = useRef(true);
  const displayStats = previewStats(stats, queued);
  const stage = Math.floor(
    Object.values(displayStats).reduce((sum, value) => sum + value, 0) / 25,
  );
  const completedBars = Object.values(displayStats).filter(
    (value) => value === 50,
  ).length;
  const drawingLabel: MessageKey =
    completedBars === 0
      ? "flower.paint.sketch"
      : completedBars === 1
        ? "flower.paint.pot"
        : completedBars === 2
          ? "flower.paint.leaves"
          : completedBars === 3
            ? "flower.paint.petals"
            : "flower.paint.complete";
  function updateQueue(next: Care[]) {
    queue.current = next;
    setQueued(next);
  }
  function applyPlant(plant: Plant) {
    if (plantGeneration.current !== plant.generation) {
      plantGeneration.current = plant.generation;
      setNotice("");
      setActive(null);
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      updateQueue([]);
    }
    setContribution((previous) =>
      previous.generation === plant.generation
        ? previous
        : { generation: plant.generation, count: 0 },
    );
    setStats(plant.stats);
    confirmed.current = plant.stats;
    setLoaded(true);
    setFailed(false);
  }
  useEffect(() => {
    let current = true;
    async function refresh() {
      if (busy.current) return;
      const version = ++revision.current;
      try {
        const { plant } = await requestPlant();
        if (current && version === revision.current) applyPlant(plant);
      } catch {
        if (current && version === revision.current) setFailed(true);
      }
    }
    void refresh();
    const poll = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      current = false;
      clearInterval(poll);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      queue.current = [];
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function care(action: Care) {
    if (!loaded || failed) return;
    if (previewStats(confirmed.current, queue.current)[action.id] >= 50) {
      setNotice("flower.notice.full");
      return;
    }
    updateQueue([...queue.current, action]);
    setNotice("flower.notice.caring");
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (timer.current) clearTimeout(timer.current);
      setActive(action);
      setEffectId((id) => id + 1);
      timer.current = setTimeout(() => {
        setActive(null);
        timer.current = null;
      }, 650);
    }
    void saveCare();
  }

  async function saveCare() {
    if (busy.current) return;
    if (!queue.current.length) return;
    busy.current = true;
    setPending(true);
    ++revision.current;
    try {
      while (queue.current.length) {
        const action = queue.current[0];
        const previousGeneration = plantGeneration.current;
        const { plant, status } = await requestPlant(action.id);
        if (!mounted.current) return;
        updateQueue(queue.current.slice(1));
        applyPlant(plant);
        if (status === 200) {
          setContribution((previous) => ({
            generation: plant.generation,
            count:
              (previous.generation === plant.generation ? previous.count : 0) +
              1,
          }));
        }
        if (
          plant.generation !== previousGeneration ||
          plant.error === "day_changed"
        ) {
          updateQueue([]);
          setNotice("flower.notice.newDay");
          break;
        }
        if (status === 429) {
          updateQueue([]);
          setNotice("flower.notice.wait");
          break;
        }
        if (status === 409) {
          // Another visitor may have filled this bar while our clicks were queued.
          updateQueue(queue.current.filter((entry) => entry.id !== action.id));
          setNotice("flower.notice.full");
        } else {
          setNotice(action.response);
        }
      }
    } catch {
      if (!mounted.current) return;
      updateQueue([]);
      setFailed(true);
      setNotice("flower.notice.unconfirmed");
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  const ordinaryNotice =
    !notice ||
    notice === "flower.notice.caring" ||
    actions.some((action) => action.response === notice);
  const feedback = failed
    ? notice === "flower.notice.unconfirmed"
      ? notice
      : "flower.unavailable"
    : !loaded
      ? "flower.loading"
      : ordinaryNotice && contribution.count >= 10
        ? "flower.notice.thanks"
        : ordinaryNotice && contribution.count >= 6
          ? "flower.notice.encourage"
          : ordinaryNotice && contribution.count >= 3
            ? "flower.notice.growing"
            : notice;

  return (
    <ModuleFrame
      id="flower"
      title={t("flower.title")}
      english=""
      icon="flower"
      className="flower"
    >
      <div aria-busy={!loaded && !failed}>
        <div
          className="flower-stage"
          data-stage={loaded ? stage : undefined}
          data-care={active?.id ?? "idle"}
        >
          {loaded ? (
            <>
              <span className="plant-label">{t(drawingLabel)}</span>
              <WatercolorFlower stats={displayStats} />
              {active ? (
                <span
                  className={`care-effect effect-${active.id}`}
                  key={effectId}
                  aria-hidden="true"
                >
                  {active.id === "food" ? (
                    <FertilizerBagIcon size={28} />
                  ) : (
                    active.effect
                  )}
                </span>
              ) : null}
            </>
          ) : null}
        </div>
        {loaded ? (
          <div
            className="plant-meters"
            data-recognition={contribution.count >= 10 ? "thanks" : undefined}
          >
            {actions.map((action) => (
              <div className="plant-stat" key={action.id}>
                <span>{t(action.stat)}</span>
                <meter
                  aria-label={t(action.stat)}
                  min="0"
                  max="50"
                  value={displayStats[action.id]}
                  aria-busy={queued.some((entry) => entry.id === action.id)}
                />
              </div>
            ))}
          </div>
        ) : null}
        <div className="care-actions">
          {actions.map((action) => (
            <button
              key={action.id}
              className="bevel"
              type="button"
              disabled={!loaded || failed}
              onClick={() => care(action)}
            >
              <span aria-hidden="true">
                {action.id === "food" ? (
                  <FertilizerBagIcon />
                ) : (
                  action.icon
                )}{" "}
              </span>
              {t(action.label)}
            </button>
          ))}
        </div>
        <p
          className="plant-notice"
          role="status"
          aria-label={t("flower.status")}
        >
          {feedback ? t(feedback) : ""}
        </p>
        <div className="plant-tools">
          <button
            type="button"
            className="text-button"
            disabled={pending || (!loaded && !failed)}
            onClick={async () => {
              if (busy.current) return;
              busy.current = true;
              setPending(true);
              const version = ++revision.current;
              try {
                const { plant } = await requestPlant();
                if (version === revision.current) {
                  applyPlant(plant);
                  setNotice("");
                }
              } catch {
                setFailed(true);
              } finally {
                busy.current = false;
                setPending(false);
                void saveCare();
              }
            }}
          >
            {t("flower.refresh")}
          </button>
        </div>
      </div>
    </ModuleFrame>
  );
}
