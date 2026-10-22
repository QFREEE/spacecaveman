import { useState, type ReactNode } from "react";
type NycStatusValue = "in_nyc" | "not_in_nyc" | "unknown";

function SceneDrawing({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 300 125"
      fill="var(--skin-surface)"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function StatusScene({ status }: { status: NycStatusValue }) {
  return (
    <div className="nyc-skyline" data-scene={status} aria-hidden="true">
      {status === "not_in_nyc" ? (
        <>
          <SceneDrawing>
            <path d="M12 114q48-9 93-2t88-1 95 3" fill="none" />
            <path d="M43 103V78m-20 0 21-35 20 35H23Zm5-18 16-29 17 29M78 109V88m-17 0 18-31 18 31H61ZM235 107V76m-25 0 24-43 25 43h-49Zm6-19 18-35 19 35M275 111V91m-16 0 16-28 16 28h-32Z" />
            <path
              d="M112 110l3-5 3 5m79 1 3-6 4 6M32 24h6m-3-3v6M175 32q5-5 10 0 5-5 10 0"
              fill="none"
            />
          </SceneDrawing>
          <div className="nyc-scene-motion nyc-woods-person">
            <SceneDrawing>
              <circle cx="151" cy="75" r="7" />
              <path d="M146 82q5 3 10 0l3 17h-15l2-17ZM145 86l-8 9m20-9 8 6 6-7M147 99l-3 12m11-12 4 12m-19 0h5m13 0h5" />
              <path d="M148 73h.2m6 0h.2m-5 5q2 1 4-1" fill="none" />
            </SceneDrawing>
          </div>
        </>
      ) : (
        <>
          <SceneDrawing>
            <path d="M10 111h280M24 110V66h31v44M59 111V46h28v65M93 111V61h26v50M125 110V35h9V24h7V10m0 14h7v11h9v76M165 111V55h24v56M196 110V39h31v72M234 111V71h32v40M272 111V89h15v22" />
            <path d="M32 76h5m8 0h4M32 87h5m8 0h4M67 57h4m7 0h3M67 70h4m7 0h3M67 83h4m7 0h3M134 48h5m8 0h4m-17 14h5m8 0h4m-17 14h5m8 0h4M204 52h5m8 0h4m-17 14h5m8 0h4m-17 14h5m8 0h4M242 82h5m8 0h5M242 95h5m8 0h5M103 73v6m7-6v6M173 68v6m8-6v6" />
            <path d="M23 26h7m-3-4v8m225-11h6m-3-3v6M8 118q75-4 144 1t140-1" />
          </SceneDrawing>
          {status === "in_nyc" ? (
            <div className="nyc-scene-motion nyc-arriving-train">
              <SceneDrawing>
                <path d="M86 105V88q0-4 4-4h96q9 0 15 9l6 9v5H86Z" />
                <path d="M94 90h15v9H94Zm22 0h15v9h-15Zm22 0h15v9h-15Zm22 0h14v17m12-17h6l6 9h-12ZM88 103h77m35 0h5" />
                <circle cx="101" cy="109" r="4" />
                <circle cx="184" cy="109" r="4" />
              </SceneDrawing>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export function NycReveal({
  status,
  answer,
}: {
  status: NycStatusValue;
  answer: string;
}) {
  const [settled, setSettled] = useState(false);
  return (
    <div
      className="nyc-reveal"
      data-settled={settled}
      onAnimationEnd={() => setSettled(true)}
    >
      <StatusScene status={status} />
      <p
        className="presence-answer"
        data-status={status}
        role="status"
        aria-atomic="true"
      >
        {answer}
      </p>
    </div>
  );
}
