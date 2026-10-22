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
        {t("clock.location")}: {accessibleTime}
      </span>
      <span className="space-time-location" aria-hidden="true">
        {t("clock.location")}
      </span>
      <span className="space-time-instruments" aria-hidden="true">
        <svg
          className="space-clock"
          viewBox="0 0 80 80"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="40" cy="40" r="36" />
          <circle
            cx="40"
            cy="40"
            r="32"
            strokeDasharray="1 15.76"
            opacity=".45"
          />
          {Array.from({ length: 12 }, (_, index) => (
            <path
              key={index}
              d="M40 8v4"
              transform={`rotate(${index * 30} 40 40)`}
            />
          ))}
          <path
            className="clock-hour"
            d="M40 40V21"
            strokeWidth="3"
            transform={`rotate(${hour * 30 + minute / 2} 40 40)`}
          />
          <path
            className="clock-minute"
            d="M40 40V14"
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
