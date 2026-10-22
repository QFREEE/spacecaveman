import { useEffect, useState } from "react";
import { useLanguage } from "./Language";

const timeZone = "America/New_York";
const handTime = new Intl.DateTimeFormat("en-US", {
  timeZone,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function SpaceTime() {
  const { language, t } = useLanguage();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function update() {
      clearTimeout(timer);
      setNow(new Date());
      timer = setTimeout(update, 60000 - (Date.now() % 60000));
    }
    function resume() {
      if (!document.hidden) update();
    }
    update();
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("focus", update);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("focus", update);
    };
  }, []);

  const locale = language === "zh" ? "zh-CN" : "en-US";
  const parts = handTime.formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")!.value);
  const minute = Number(parts.find((part) => part.type === "minute")!.value);
  const calendar = new Intl.DateTimeFormat(locale, {
    timeZone,
    month: "short",
    day: "numeric",
    weekday: "short",
  }).formatToParts(now);
  const datePart = (type: Intl.DateTimeFormatPartTypes) =>
    calendar.find((part) => part.type === type)!.value;
  const accessibleTime = new Intl.DateTimeFormat(locale, {
    timeZone,
    dateStyle: "full",
    timeStyle: "short",
  }).format(now);

  return (
    <time className="space-time" dateTime={now.toISOString()}>
      <span className="sr-only">
        {t("clock.label")}: {accessibleTime}
      </span>
      <span className="earth-dial" aria-hidden="true">
        <svg
          className="space-clock"
          viewBox="0 0 80 80"
          fill="none"
          stroke="currentColor"
        >
          <path
            d="M40 4C61 3 77 20 76 40C77 61 60 77 39 76C18 77 3 60 4 39C3 18 20 3 40 4Z"
            fill="var(--skin-surface)"
            strokeWidth="1.2"
          />
          <g
            className="earth-continents"
            fill="currentColor"
            strokeWidth=".5"
            strokeLinejoin="round"
          >
            <path d="M15 25L20 18L28 15L33 17L36 22L32 26L33 30L29 34L28 39L24 36L23 32L18 30Z" />
            <path d="M29 39L35 42L39 48L36 54L35 60L31 65L29 59L29 52L26 47Z" />
            <path d="M34 12L40 10L43 13L39 19L35 18Z" />
            <path d="M43 20L48 17L53 18L55 15L62 19L66 25L63 30L57 29L55 33L51 31L48 28L44 29L40 26Z" />
            <path d="M44 31L52 32L56 38L52 43L49 51L45 49L43 42L40 37Z" />
            <path d="M59 49L65 46L68 50L66 55L59 55L56 52Z" />
          </g>
          {Array.from({ length: 12 }, (_, index) => (
            <path
              key={index}
              d="M40 8v4"
              transform={`rotate(${index * 30} 40 40)`}
            />
          ))}
          <g
            className="clock-numerals"
            fill="currentColor"
            stroke="none"
            textAnchor="middle"
          >
            <text x="40" y="18">
              12
            </text>
            <text x="65" y="43">
              3
            </text>
            <text x="40" y="72">
              6
            </text>
            <text x="15" y="43">
              9
            </text>
          </g>
          <path
            className="clock-hour"
            d="M40 42L39 25"
            strokeWidth="2.4"
            transform={`rotate(${hour * 30 + minute / 2} 40 40)`}
          />
          <path
            className="clock-minute"
            d="M40 43L41 14"
            strokeWidth="1.5"
            transform={`rotate(${minute * 6} 40 40)`}
          />
          <circle cx="40" cy="40" r="2.5" fill="currentColor" stroke="none" />
        </svg>
        <span className="space-calendar">
          <span className="calendar-month">
            {now.toLocaleDateString(locale, { timeZone, month: "short" })}
          </span>
          <span className="calendar-day">{datePart("day")}</span>
          <span className="calendar-weekday">{datePart("weekday")}</span>
        </span>
      </span>
    </time>
  );
}
