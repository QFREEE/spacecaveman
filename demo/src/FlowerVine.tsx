import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./Language";
import type { MessageKey } from "./i18n/en";
import { ModuleFrame } from "./ModuleFrame";

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
const stages = [
  "flower.stage.sprout",
  "flower.stage.leaves",
  "flower.stage.bud",
  "flower.stage.bloom",
] as const;
const initialStats = { rain: 0, sun: 0, love: 0, food: 0 };

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
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const revision = useRef(0);
  const plantGeneration = useRef(0);
  const stage = Math.floor((Math.min(...Object.values(stats)) * 3) / 50);
  function applyPlant(plant: Plant) {
    if (plantGeneration.current !== plant.generation) {
      plantGeneration.current = plant.generation;
      setNotice("");
      setActive(null);
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    }
    setContribution((previous) =>
      previous.generation === plant.generation
        ? previous
        : { generation: plant.generation, count: 0 },
    );
    setStats(plant.stats);
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
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function care(action: Care) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    ++revision.current;
    try {
      const { plant, status } = await requestPlant(action.id);
      applyPlant(plant);
      if (status === 200) {
        setContribution((previous) => ({
          generation: plant.generation,
          count:
            (previous.generation === plant.generation ? previous.count : 0) + 1,
        }));
      }
      setNotice(
        status === 429
          ? "flower.notice.wait"
          : status === 409
            ? plant.error === "day_changed"
              ? "flower.notice.newDay"
              : "flower.notice.full"
            : Object.values(plant.stats).every((value) => value === 50)
              ? "flower.notice.bloomed"
              : action.response,
      );
      if (
        status === 200 &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        if (timer.current) clearTimeout(timer.current);
        setActive(action);
        setEffectId((id) => id + 1);
        timer.current = setTimeout(() => {
          setActive(null);
          timer.current = null;
        }, 650);
      }
    } catch {
      setFailed(true);
      setNotice("flower.notice.unconfirmed");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  const ordinaryNotice =
    !notice || actions.some((action) => action.response === notice);
  const feedback = failed
    ? notice === "flower.notice.unconfirmed"
      ? notice
      : "flower.unavailable"
    : !loaded
      ? "flower.loading"
      : ordinaryNotice && contribution.count > 0 && stage === 3
        ? "flower.notice.bloomed"
        : ordinaryNotice && contribution.count >= 10
          ? "flower.notice.thanks"
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
              <span className="plant-label">{t(stages[stage])}</span>
              <svg
                viewBox="0 0 200 153"
                aria-hidden="true"
                fill="var(--skin-surface)"
                stroke="var(--skin-text-strong)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M8 139q22-5 41 0m107 0 28 1M49 136q49-12 101 0" />
                <path
                  d="M76 110l5 31q20 7 39-1l5-30M73 108q25-8 54 0v8q-27 7-54 0z"
                  fill={
                    stats.rain ? "var(--skin-wet-soil)" : "var(--skin-surface)"
                  }
                />
                <path
                  d={
                    stage === 0
                      ? "M100 105Q96 90 103 78"
                      : "M100 105Q90 66 103 42"
                  }
                />
                <path d="M98 95q-24 0-26-18 21-3 26 18m2-9q21 1 25-16-20-4-25 16" />
                {stage >= 1 ? (
                  <path d="M98 67q-19 0-20-15 18-2 20 15m3-10q17 1 20-12-15-4-20 12" />
                ) : null}
                {stage === 2 ? (
                  <path d="M103 43q-18-13-5-24l5 5 6-5q12 14-6 24z" />
                ) : null}
                {stage === 3 ? (
                  <g>
                    <path d="M103 30q-17-22-22-6-20-4-14 10-10 13 8 18 0 18 17 8 13 14 19-2 19 2 15-14 18-11 1-20-3-17-17-8z" />
                    <circle cx="100" cy="41" r="11" />
                    <path d="M95 43q5 6 10-1" />
                    <circle cx="96" cy="38" r=".7" />
                    <circle cx="105" cy="38" r=".7" />
                  </g>
                ) : null}
                {stats.rain > 0 ? (
                  <path
                    className="wet-soil"
                    d="M84 112l6 1m8 0h6m8-1h5"
                    strokeWidth="3"
                  />
                ) : null}
              </svg>
              {active ? (
                <span
                  className={`care-effect effect-${active.id}`}
                  key={effectId}
                  aria-hidden="true"
                >
                  {active.effect}
                </span>
              ) : null}
            </>
          ) : null}
        </div>
        {loaded ? (
          <div
            className="plant-meters"
            data-recognition={
              contribution.count > 0 && stage === 3
                ? "bloom"
                : contribution.count >= 10
                  ? "thanks"
                  : undefined
            }
          >
            {actions.map((action) => (
              <div className="plant-stat" key={action.id}>
                <span>{t(action.stat)}</span>
                <meter
                  aria-label={t(action.stat)}
                  min="0"
                  max="50"
                  value={stats[action.id]}
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
              disabled={pending || !loaded || failed}
              onClick={() => care(action)}
            >
              <span aria-hidden="true">{action.icon} </span>
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
