import { useLegacyLanguage as useLanguage } from "./legacy/Language";
import { ModuleFrame } from "./ModuleFrame";
import { useTheme } from "./themes/ThemeProvider";
import { showThemeSelector } from "./themes/settings";

export function DressUp({
  wallpaper,
  setWallpaper,
  ornaments,
  setOrnaments,
  unlocked,
  flag,
  setFlag,
  restore,
}: {
  wallpaper: string;
  setWallpaper: (v: string) => void;
  ornaments: boolean;
  setOrnaments: (v: boolean) => void;
  unlocked: boolean;
  flag: boolean;
  setFlag: (v: boolean) => void;
  restore: () => void;
}) {
  const { t } = useLanguage();
  const { theme, themes, setThemeId } = useTheme();
  return (
    <ModuleFrame
      id="dressup"
      title={t("装扮空间")}
      english="DRESS UP"
      icon="dressup"
      className="dressup"
    >
      <p className="dressup-intro">{t("小小空间，自己摆弄。")}</p>
      {showThemeSelector ? (
        <fieldset>
          <legend>{t("空间风格")}</legend>
          <div className="theme-choices">
            {themes.map((item) => (
              <button
                type="button"
                className="bevel"
                key={item.id}
                aria-pressed={theme.id === item.id}
                onClick={() => setThemeId(item.id)}
              >
                {t(item.label)}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}
      <fieldset>
        <legend>{t("背景")}</legend>
        <div className="wallpaper-choices">
          {[
            ["stars", "星空"],
            ["paper", "白纸"],
          ].map(([value, label]) => (
            <button
              className={`bevel swatch swatch-${value}`}
              key={value}
              aria-pressed={wallpaper === value}
              onClick={() => setWallpaper(value)}
            >
              {t(label)}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="ornament-toggle">
        <input
          type="checkbox"
          checked={ornaments}
          onChange={(e) => setOrnaments(e.target.checked)}
        />
        {t("土星挂件")}
      </label>
      <div className="treasure-drawer">
        <h3>◇ {t("我的物品")}</h3>
        {unlocked ? (
          <label className="ornament-toggle">
            <input
              type="checkbox"
              checked={flag}
              onChange={(e) => setFlag(e.target.checked)}
            />
            {t("月球旗 · 开花奖励")}
          </label>
        ) : (
          <p>{t("照料花藤开花，领取一面月球旗。")}</p>
        )}
      </div>
      <button className="bevel restore-skin" onClick={restore}>
        {t("恢复默认装扮")}
      </button>
      <p className="fine-print">{t("本地演示 · 刷新后重置")}</p>
    </ModuleFrame>
  );
}
