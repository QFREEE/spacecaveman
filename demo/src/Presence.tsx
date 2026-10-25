import { useEffect, useState, type ReactNode } from "react";
import { useLanguage } from "./Language";

type Report = {
  status: "in_nyc" | "not_in_nyc" | "unknown";
  borough?:
    "manhattan" | "brooklyn" | "queens" | "bronx" | "staten_island" | null;
  observed_at: string | null;
  expires_at: string | null;
};

export function Presence({
  renderAnswer,
}: {
  renderAnswer: (status: Report["status"], answer: string) => ReactNode;
}) {
  const { t } = useLanguage();
  const [report, setReport] = useState<Report | null>(null);
  const [health, setHealth] = useState("loading");
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    let disposed = false;
    let controller: AbortController | undefined;
    async function refresh() {
      setNow(Date.now());
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch("/api/presence/public", {
          cache: "no-store",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(10000),
          ]),
        });
        if (!response.ok) throw new Error("Refresh failed");
        const next: Report = await response.json();
        if (!["in_nyc", "not_in_nyc", "unknown"].includes(next.status))
          throw new Error("Invalid status");
        if (disposed) return;
        setReport(next);
        setNow(Date.now());
        setHealth("connected");
      } catch (error) {
        if (
          !disposed &&
          !(error instanceof Error && error.name === "AbortError")
        )
          setHealth("error");
      }
    }
    const onVisible = () => {
      if (!document.hidden) void refresh();
    };
    void refresh();
    const interval = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 60_000);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      controller?.abort();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    const delay = Date.parse(report?.expires_at ?? "") - Date.now();
    if (!(delay > 0)) return;
    const timer = setTimeout(() => setNow(Date.now()), delay + 1);
    return () => clearTimeout(timer);
  }, [report]);

  const active = report && Date.parse(report.expires_at ?? "") > now;
  const state = active ? report.status : "unknown";
  const borough =
    state === "in_nyc" &&
    ["manhattan", "brooklyn", "queens", "bronx", "staten_island"].includes(
      report?.borough ?? "",
    )
      ? report?.borough
      : null;
  const observed = Date.parse(report?.observed_at ?? "");
  const label =
    state === "in_nyc"
      ? t("presence.inNyc")
      : state === "not_in_nyc"
        ? t("presence.outsideNyc")
        : t("presence.unknown");
  const age = Math.max(0, now - observed);
  const recency =
    age < 5 * 60_000
      ? t("presence.updatedJustNow")
      : age < 15 * 60_000
        ? t("presence.updatedMinutes")
        : age < 30 * 60_000
          ? t("presence.updatedHalfHour")
          : age < 60 * 60_000
            ? t("presence.updatedHour")
            : age < 120 * 60_000
              ? t("presence.updatedOneHour")
              : age < 180 * 60_000
                ? t("presence.updatedTwoHours")
                : age < 240 * 60_000
                  ? t("presence.updatedThreeHours")
                  : t("presence.updatedEarlier");
  return (
    <section
      className="presence-strip"
      aria-label={t("presence.label")}
      aria-busy={health === "loading"}
    >
      {health === "loading" ? (
        <div className="presence-loading">
          <div className="nyc-loading-scene" aria-hidden="true">
            · · ·
          </div>
          <p role="status" aria-atomic="true">
            {t("presence.loading")}
          </p>
        </div>
      ) : (
        renderAnswer(state, label)
      )}
      {borough ? (
        <p className="presence-borough">{t(`presence.borough.${borough}`)}</p>
      ) : null}
      {Number.isFinite(observed) || health === "error" ? (
        <div className="presence-detail">
          {Number.isFinite(observed) ? <span>{recency}</span> : null}
          {health === "error" ? (
            <small>{t("presence.refreshFailed")}</small>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
