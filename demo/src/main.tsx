import { useLanguage, LanguageProvider, LanguageSwitch } from "./Language";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { SpaceTime } from "./SpaceTime";
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
          <Scene />
          <SpaceTime />
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
          <FlowerVine />
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
