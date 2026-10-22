import { useLanguage, LanguageProvider, LanguageSwitch } from "./Language";
import { createRoot } from "react-dom/client";
import { StrictMode, useCallback, useState } from "react";
import { FlowerVine } from "./FlowerVine";
import { ThemeProvider, useTheme } from "./themes/ThemeProvider";
import { NycStatus } from "./NycStatus";
import { VisitorCounter } from "./VisitorCounter";
import "./styles/qzone.css";
import "./styles/space.css";
import "./styles/home.css";

function readSetting(key: string) {
  try {
    return localStorage.getItem(`spacecaveman:${key}`);
  } catch {
    return null;
  }
}
function saveSetting(key: string, value: string) {
  try {
    localStorage.setItem(`spacecaveman:${key}`, value);
  } catch {
    /* Optional browser preference. */
  }
}

function App() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const Scene = theme.Scene;
  const [unlocked, setUnlocked] = useState(() => readSetting("bloom") !== null);
  const [flag, setFlag] = useState(() => readSetting("flag") === "true");
  const onBloom = useCallback((generation: number) => {
    setUnlocked(true);
    if (readSetting("bloom") !== String(generation)) {
      setFlag(true);
      saveSetting("flag", "true");
      saveSetting("bloom", String(generation));
    }
  }, []);
  return (
    <div data-theme={theme.id} className="space-shell wallpaper-stars">
      <div className="topbar">
        <div>
          <a href="#home" className="top-brand" lang="en">
            <span className="pixel-icon icon-home" aria-hidden="true" />
            {t("site.title")}
          </a>
          <LanguageSwitch />
        </div>
      </div>
      <div className="site" id="home">
        <header className="masthead">
          <div className="masthead-copy">
            <h1 lang="en">{t("site.title")}</h1>
          </div>
          <Scene ornaments treasure={flag} />
        </header>
        <nav className="navigation home-navigation" aria-label={t("nav.label")}>
          {[
            ["home", t("nav.home")],
            ["nyc", t("nav.nyc")],
            ["flower", t("flower.title")],
            ["visitors", t("nav.visitors")],
          ].map(([id, label], index) => (
            <a
              key={id}
              href={`#${id}`}
              className={index === 0 ? "home-link" : ""}
            >
              {label}
            </a>
          ))}
        </nav>
        <main className="modules home-modules">
          <NycStatus />
          <FlowerVine
            onBloom={onBloom}
            reward={
              unlocked ? (
                <label className="ornament-toggle flower-reward">
                  <input
                    type="checkbox"
                    checked={flag}
                    onChange={(event) => {
                      setFlag(event.target.checked);
                      saveSetting("flag", String(event.target.checked));
                    }}
                  />
                  {t("flower.showFlag")}
                </label>
              ) : null
            }
          />
          <VisitorCounter />
        </main>
        <footer>
          <a href="#home">{t("nav.backToTop")}</a>
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
