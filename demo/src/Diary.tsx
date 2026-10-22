import { useLegacyLanguage as useLanguage } from "./legacy/Language";
import { useState } from "react";
import { diaries } from "./data";
import { ModuleFrame } from "./ModuleFrame";

export function Diary() {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState<string[]>([]);
  return (
    <ModuleFrame
      id="diary"
      title={t("我的日志")}
      english="LITTLE DAYS"
      icon="diary"
      className="diary"
      extra={<span className="heading-note">{t("共 2 篇")}</span>}
    >
      <p className="update">
        <span className="new-label">{t("心情")}</span>
        {t("今天也有好好地给花浇水。")}
        <time>08-18</time>
      </p>
      {diaries.map((entry) => (
        <article className="diary-entry" key={entry.id}>
          <div className="entry-heading">
            <h3>{t(entry.title)}</h3>
            <time dateTime={entry.date}>{entry.date}</time>
          </div>
          <p className="entry-category">
            {t("分类：")}
            {t(entry.category)}
          </p>
          <p className="entry-text">{t(entry.text)}</p>
          <p
            id={`entry-${entry.id}`}
            className="entry-text"
            hidden={!expanded.includes(entry.id)}
          >
            {t(entry.more)}
          </p>
          <div className="entry-bottom">
            <button
              className="text-button"
              aria-expanded={expanded.includes(entry.id)}
              aria-controls={`entry-${entry.id}`}
              onClick={() =>
                setExpanded((prev) =>
                  prev.includes(entry.id)
                    ? prev.filter((id) => id !== entry.id)
                    : [...prev, entry.id],
                )
              }
            >
              {expanded.includes(entry.id) ? t("收起日志") : t("阅读全文")}
              <span aria-hidden="true"> »</span>
            </button>
            <span>
              {t("阅读(")}
              {entry.reads}
              {t(") · 评论(")}
              {entry.comments})<small>{t("示例")}</small>
            </span>
          </div>
        </article>
      ))}
    </ModuleFrame>
  );
}
