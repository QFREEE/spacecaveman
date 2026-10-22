import { useLanguage, LanguageProvider, LanguageSwitch } from "./Language";
import { createRoot } from "react-dom/client";
import { StrictMode, useState } from "react";
import { FlowerVine } from "./FlowerVine";
import { ThemeProvider, useTheme } from "./themes/ThemeProvider";
import { NycStatus } from "./NycStatus";
import { VisitorCounter } from "./VisitorCounter";
import "./styles/qzone.css";
import "./styles/space.css";
import "./styles/home.css";

function App() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const Scene = theme.Scene;
  const [motion, setMotion] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [flag, setFlag] = useState(false);
  return (
    <div
      data-theme={theme.id}
      className={`space-shell wallpaper-stars ${motion ? "" : "motion-off"}`}
    >
      <div className="topbar">
        <div>
          <a href="#home" className="top-brand">
            <span className="pixel-icon icon-home" aria-hidden="true" />
            {t("月球洞口")}
          </a>
          <span className="top-tag">{t("一页旧时光")}</span>
          <LanguageSwitch />
          <span className="demo-badge">{t("虚构空间 · DEMO")}</span>
        </div>
      </div>
      <div className="site" id="home">
        <header className="masthead">
          <div className="masthead-copy">
            <div className="site-number">PERSONAL SPACE / NO. 00816 / 2007</div>
            <h1>{t("月球洞口")}</h1>
            <p>{t("一小步。大部分时候在闲逛。")}</p>
            <span className="space-url">
              spacecaveman.com / my little Qzone
            </span>
          </div>
          <Scene ornaments treasure={flag} />
          <div className="skin-toolbar">
            <button
              className="bevel"
              aria-pressed={!motion}
              onClick={() => setMotion((v) => !v)}
            >
              {motion ? t("暂停动画") : t("继续动画")}
            </button>
          </div>
        </header>
        <nav className="navigation home-navigation" aria-label={t("空间导航")}>
          {[
            ["home", t("主页")],
            ["nyc", t("纽约状态")],
            ["flower", t("花藤")],
            ["visitors", t("小站足迹")],
          ].map(([id, label], index) => (
            <a
              key={id}
              href={`#${id}`}
              className={index === 0 ? "home-link" : ""}
            >
              {label}
            </a>
          ))}
          <span className="nav-note">{t("欢迎光临我的空间")}</span>
        </nav>
        <div className="welcome">
          <span className="pixel-icon icon-note" aria-hidden="true" />
          <span>{t("小站公告：来都来了，给我的月球花浇点水吧。")}</span>
        </div>
        <main className="modules home-modules">
          <NycStatus />
          <FlowerVine
            onBloom={() => {
              setUnlocked(true);
              setFlag(true);
            }}
            reward={
              unlocked ? (
                <label className="ornament-toggle flower-reward">
                  <input
                    type="checkbox"
                    checked={flag}
                    onChange={(event) => setFlag(event.target.checked)}
                  />
                  {t("月球旗 · 开花奖励")}
                </label>
              ) : null
            }
          />
          <VisitorCounter />
        </main>
        <footer>
          <a href="#home">{t("回到顶部")}</a>
          <span>{t("月球洞口 · 留下一点脚印")}</span>
          <p>{t("Qzone 风格小站 · 花藤为本地演示 · 计数为样本数据")}</p>
        </footer>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>,
);
