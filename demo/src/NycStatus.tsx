import { useLanguage } from "./Language";
import { ModuleFrame } from "./ModuleFrame";

type NycStatusValue = "in_nyc" | "not_in_nyc" | "unknown";

const answers: Record<NycStatusValue, string> = {
  in_nyc: "在，我在纽约！",
  not_in_nyc: "今天不在纽约。",
  unknown: "还没有更新。",
};

// Public status stays unknown until an authorized public data source is connected.
export function NycStatus({ status = "unknown" }: { status?: NycStatusValue }) {
  const { t } = useLanguage();
  return (
    <ModuleFrame
      id="nyc"
      title={t("我在纽约吗？")}
      english=""
      icon="home"
      className="nyc-status"
    >
      <div className="nyc-skyline" aria-hidden="true">
        <svg
          viewBox="0 0 300 125"
          fill="var(--skin-surface)"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 111h280M24 110V66h31v44M59 111V46h28v65M93 111V61h26v50M125 110V35h9V24h7V10m0 14h7v11h9v76M165 111V55h24v56M196 110V39h31v72M234 111V71h32v40M272 111V89h15v22" />
          <path d="M32 76h5m8 0h4M32 87h5m8 0h4M67 57h4m7 0h3M67 70h4m7 0h3M67 83h4m7 0h3M134 48h5m8 0h4m-17 14h5m8 0h4m-17 14h5m8 0h4M204 52h5m8 0h4m-17 14h5m8 0h4m-17 14h5m8 0h4M242 82h5m8 0h5M242 95h5m8 0h5M103 73v6m7-6v6M173 68v6m8-6v6" />
          <path d="M23 26h7m-3-4v8m225-11h6m-3-3v6M8 118q75-4 144 1t140-1" />
        </svg>
      </div>
      <p
        className="presence-answer"
        data-status={status}
        role="status"
        aria-atomic="true"
      >
        {t(answers[status])}
      </p>
    </ModuleFrame>
  );
}
