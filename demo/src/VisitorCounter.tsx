import { useLanguage } from "./Language";
import { ModuleFrame } from "./ModuleFrame";
import { useEffect, useRef, useState } from "react";

export function VisitorCounter() {
  const { t } = useLanguage();
  const [views, setViews] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  // Reuse the pending request during StrictMode's effect replay.
  const pending = useRef<Promise<number> | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    pending.current ??= fetch("/api/visitors", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
    }).then(async (response) => {
      if (!response.ok) throw new Error("Counter unavailable");
      const data = await response.json();
      if (!Number.isSafeInteger(data.views) || data.views < 0)
        throw new Error("Invalid counter");
      return data.views as number;
    });
    pending.current.then(
      (count) => {
        if (current) setViews(count);
      },
      () => {
        if (current) setFailed(true);
      },
    );
    return () => {
      current = false;
    };
  }, [attempt]);
  return (
    <ModuleFrame
      id="visitors"
      title={t("nav.visitors")}
      english=""
      icon="home"
      className="visitors"
    >
      <p>{t("visitors.total")}</p>
      <div className="counter" role="status" aria-label={t("visitors.total")}>
        {(views === null ? "------" : String(views).padStart(6, "0"))
          .split("")
          .map((number, index) => (
            <span key={index}>{number}</span>
          ))}
      </div>
      {failed || views === null ? (
        <p className="fine-print">
          {t(failed ? "visitors.unavailable" : "visitors.loading")}
        </p>
      ) : null}
      {failed ? (
        <button
          className="bevel"
          onClick={() => {
            pending.current = null;
            setFailed(false);
            setAttempt((value) => value + 1);
          }}
        >
          {t("common.retry")}
        </button>
      ) : null}
    </ModuleFrame>
  );
}
