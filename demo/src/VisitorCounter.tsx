import { useLanguage } from "./Language";
import { ModuleFrame } from "./ModuleFrame";

export function VisitorCounter() {
  const { t } = useLanguage();
  return (
    <ModuleFrame
      id="visitors"
      title={t("小站足迹")}
      english="FOOTPRINTS"
      icon="home"
      className="visitors"
    >
      <p>{t("你是这里的第")}</p>
      <div className="counter" aria-label={t("样本访问次数 1286")}>
        {"001286".split("").map((number, index) => (
          <span key={index}>{number}</span>
        ))}
      </div>
      <p>{t("位过客。谢谢你的停留。")}</p>
      <p className="fine-print">{t("装饰计数器 · 样本数据")}</p>
      <p className="visitor-quote">
        {t("“愿每次路过，")}
        <br />
        {t("都能遇见一点小小的快乐。”")}
      </p>
    </ModuleFrame>
  );
}
