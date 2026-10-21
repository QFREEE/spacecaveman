import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./Language";
import { ModuleFrame } from "./ModuleFrame";

const actions = [
  {
    id: "rain",
    label: "浇花",
    stat: "雨露",
    icon: "♧",
    effect: "﹅ ﹅ ﹅",
    response: "泥土湿润了，叶子精神起来了。",
  },
  {
    id: "sun",
    label: "日照",
    stat: "阳光",
    icon: "☼",
    effect: "☼",
    response: "晒到太阳啦，暖乎乎的。",
  },
  {
    id: "love",
    label: "修剪",
    stat: "爱心",
    icon: "✂",
    effect: "✂",
    response: "修好了小枝，长得整齐一点了。",
  },
  {
    id: "food",
    label: "施肥",
    stat: "营养",
    icon: "⋄",
    effect: "✧ · ✧",
    response: "加了月球肥料，根部闪了一下。",
  },
] as const;
type Care = (typeof actions)[number];
const stages = ["嫩芽", "长叶", "花苞", "开花"];
const initialStats = { rain: 0, sun: 0, love: 0, food: 0 };

export function FlowerVine({ onBloom }: { onBloom: () => void }) {
  const { t } = useLanguage();
  const [stats, setStats] = useState(initialStats);
  const [active, setActive] = useState<Care | null>(null);
  const [notice, setNotice] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [details, setDetails] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const stage = Math.min(...Object.values(stats));
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function care(action: Care) {
    if (busy.current) return;
    if (stats[action.id] === 3) {
      setNotice(
        stage === 3
          ? "开花啦！月球旗已放进我的物品。"
          : "这一项已经满了，试试其他照料。",
      );
      return;
    }
    const next = { ...stats, [action.id]: stats[action.id] + 1 };
    setStats(next);
    setLog((prev) => [action.label, ...prev].slice(0, 12));
    const bloom = Math.min(...Object.values(next)) === 3;
    setNotice(bloom ? "开花啦！月球旗已放进我的物品。" : action.response);
    if (bloom) onBloom();
    // State changes immediately. Only the short decorative response is timed.
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      busy.current = true;
      setActive(action);
      timer.current = setTimeout(() => {
        busy.current = false;
        setActive(null);
        timer.current = null;
      }, 650);
    }
  }

  function reset() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    busy.current = false;
    setStats(initialStats);
    setActive(null);
    setLog([]);
    setNotice("重新种好啦。小芽等你来照料。");
  }

  return (
    <ModuleFrame
      id="flower"
      title={t("我的花藤")}
      english="LUNAR GARDEN"
      icon="flower"
      className="flower"
      extra={<span className="heading-note">Lv.{stage + 1}</span>}
    >
      <div
        className="flower-stage"
        data-stage={stage}
        data-care={active?.id ?? "idle"}
      >
        <span className="plant-label">
          {t(stages[stage])} / 0{stage + 1}
        </span>
        <svg
          viewBox="0 0 200 153"
          aria-hidden="true"
          fill="white"
          stroke="#222"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 139q22-5 41 0m107 0 28 1M49 136q49-12 101 0" />
          <path
            d="M76 110l5 31q20 7 39-1l5-30M73 108q25-8 54 0v8q-27 7-54 0z"
            fill={stats.rain ? "#c3c3c3" : "white"}
          />
          <path
            d={stage === 0 ? "M100 105Q96 90 103 78" : "M100 105Q90 66 103 42"}
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
            key={log.length}
            aria-hidden="true"
          >
            {active.effect}
          </span>
        ) : null}
        <small>{t("月球土壤 · 认真乱养")}</small>
      </div>
      <div className="plant-meters">
        {actions.map((action) => (
          <div className="plant-stat" key={action.id}>
            <span>{t(action.stat)}</span>
            <meter
              aria-label={t(action.stat)}
              min="0"
              max="3"
              value={stats[action.id]}
            />
            <span>{stats[action.id]}/3</span>
          </div>
        ))}
      </div>
      <div className="care-actions">
        {actions.map((action) => (
          <button
            key={action.id}
            className="bevel"
            type="button"
            disabled={active !== null}
            onClick={() => care(action)}
          >
            <span aria-hidden="true">{action.icon} </span>
            {t(action.label)}
          </button>
        ))}
      </div>
      <p className="plant-hint">{t("四项都照料，花儿才会长大。")}</p>
      <p className="plant-notice" role="status" aria-label={t("花藤状态")}>
        {t(notice)}
      </p>
      <div className="plant-tools">
        <button
          type="button"
          className="text-button"
          aria-expanded={details}
          aria-controls="plant-properties"
          onClick={() => setDetails((v) => !v)}
        >
          {t("属性 / 记录")}
        </button>
        <button type="button" className="text-button" onClick={reset}>
          {t("重置演示")}
        </button>
      </div>
      {details ? (
        <div id="plant-properties" className="plant-properties">
          <p>{t("简化演示规则，并非历史计分公式。")}</p>
          <p>{t("生长阶段取四项最低值。")}</p>
          <h3>{t("照料记录")}</h3>
          {log.length ? (
            <ol>
              {log.map((entry, i) => (
                <li key={log.length - i}>{t(entry)}</li>
              ))}
            </ol>
          ) : (
            <p>{t("还没有照料记录。")}</p>
          )}
        </div>
      ) : null}
      <p className="fine-print">{t("本地演示 · 刷新后重置")}</p>
    </ModuleFrame>
  );
}
