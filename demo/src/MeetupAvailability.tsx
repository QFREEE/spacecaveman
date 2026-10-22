import { useLegacyLanguage as useLanguage } from "./legacy/Language";
import { useState } from "react";
import { availability } from "./data";
import { ModuleFrame } from "./ModuleFrame";

type Filter = "all" | "confirmed" | "tentative";
export function MeetupAvailability() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<Filter>("all");
  const [day, setDay] = useState("all");
  const visible = availability.filter(
    (item) =>
      (filter === "all" || item.status === filter) &&
      (day === "all" || item.day === day),
  );
  return (
    <ModuleFrame
      id="meetup"
      title={t("有空见个面")}
      english="LET’S MEET"
      icon="calendar"
      className="meetup"
      extra={<span className="heading-note">{t("虚构安排")}</span>}
    >
      <div className="meetup-toolbar">
        <div role="group" aria-label={t("筛选见面安排")}>
          {(
            [
              ["all", t("全部")],
              ["confirmed", t("已确定")],
              ["tentative", t("还在想")],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              className="filter"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="date-filter">
          {t("日期")}{" "}
          <select
            aria-label={t("筛选日期")}
            value={day}
            onChange={(e) => setDay(e.target.value)}
          >
            <option value="all">{t("全部日期")}</option>
            <option value="08.25">08.25</option>
            <option value="08.26">08.26</option>
          </select>
        </label>
      </div>
      <div aria-live="polite">
        {visible.length ? (
          visible.map((item) => (
            <div className="visit" key={item.id}>
              <div className="visit-date">
                <b>{item.day}</b>
                <span>{t(item.weekday)}</span>
              </div>
              <div className="visit-info">
                <strong>{t(item.place)}</strong>
                <p>
                  {item.time}{" "}
                  <span className={`status ${item.status}`}>
                    {item.status === "confirmed" ? t("已确定") : t("还在想")}
                  </span>
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="empty">
            {t("这一天没有符合筛选的安排。换个筛选看看吧。")}
          </p>
        )}
      </div>
      <p className="fine-print">
        {t("示例时间线：2007年8月18日 · 中国标准时间 UTC+8")}
      </p>
    </ModuleFrame>
  );
}
