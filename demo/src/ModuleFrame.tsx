import type { ReactNode } from "react";

export function ModuleFrame({
  id,
  title,
  english,
  icon,
  children,
  className = "",
  extra,
}: {
  id: string;
  title: string;
  english: string;
  icon: string;
  children: ReactNode;
  className?: string;
  extra?: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`module ${className}`}
      aria-labelledby={`${id}-heading`}
    >
      <div className="module-heading">
        <h2 id={`${id}-heading`}>
          <span className={`pixel-icon icon-${icon}`} aria-hidden="true" />
          {title}
          <small>{english}</small>
        </h2>
        {extra}
      </div>
      <div className="module-body">{children}</div>
    </section>
  );
}
