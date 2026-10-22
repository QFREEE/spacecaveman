import { useLanguage } from "./Language";
import { ModuleFrame } from "./ModuleFrame";
import { Presence } from "./Presence";

export function NycStatus() {
  const { t } = useLanguage();
  return (
    <ModuleFrame
      id="nyc"
      title={t("presence.question")}
      english=""
      icon="home"
      className="nyc-status"
    >
      <Presence />
    </ModuleFrame>
  );
}
