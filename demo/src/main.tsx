import { useLanguage, LanguageProvider, LanguageSwitch } from "./Language";
import { createRoot } from "react-dom/client";
import { StrictMode, useState } from "react";
import { FlowerVine } from "./FlowerVine";
import { DressUp } from "./DressUp";
import { ThemeProvider, useTheme } from "./themes/ThemeProvider";
import { Profile } from "./Profile";
import { Diary } from "./Diary";
import { MeetupAvailability } from "./MeetupAvailability";
import { PhotoAlbums } from "./PhotoAlbums";
import { MusicPlayer } from "./MusicPlayer";
import { Guestbook } from "./Guestbook";
import { ModuleFrame } from "./ModuleFrame";
import "./styles/qzone.css";
import "./styles/space.css";

function App() {
  const { t } = useLanguage();
  const { theme, resetTheme } = useTheme();
  const Scene = theme.Scene;
  const [wallpaper, setWallpaper] = useState("stars");
  const [ornaments, setOrnaments] = useState(true);
  const [motion, setMotion] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [flag, setFlag] = useState(false);
  return (
    <div
      data-theme={theme.id}
      className={`space-shell wallpaper-${wallpaper} ${motion ? "" : "motion-off"}`}
    >
      <div className="topbar">
        <div>
          <a href="#home" className="top-brand">
            <span className="pixel-icon icon-home" aria-hidden="true" />
            {t("月球洞口")}
          </a>
          <span className="top-tag">{t("一页旧时光")}</span>
          <a href="#guestbook">{t("留言给小咕")}</a>
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
          <Scene ornaments={ornaments} treasure={flag} />
          <div className="skin-toolbar">
            <a className="bevel" href="#dressup">
              {t("装扮空间")}
            </a>
            <button
              className="bevel"
              aria-pressed={!motion}
              onClick={() => setMotion((v) => !v)}
            >
              {motion ? t("暂停动画") : t("继续动画")}
            </button>
          </div>
        </header>
        <nav className="navigation" aria-label={t("空间导航")}>
          {[
            ["home", t("主页")],
            ["diary", t("日志")],
            ["albums", t("相册")],
            ["meetup", t("见面")],
            ["music", t("音乐")],
            ["guestbook", t("留言板")],
            ["profile", t("个人档")],
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
          <span className="welcome-date">{t("2007.08.18 晴")}</span>
        </div>
        <main className="modules">
          <div className="module-column left-column">
            <Profile />
            <FlowerVine onBloom={() => setUnlocked(true)} />
          </div>
          <div className="module-column center-column">
            <Diary />
            <MeetupAvailability />
            <PhotoAlbums />
            <Guestbook />
          </div>
          <div className="module-column right-column">
            <MusicPlayer />
            <DressUp
              wallpaper={wallpaper}
              setWallpaper={setWallpaper}
              ornaments={ornaments}
              setOrnaments={setOrnaments}
              unlocked={unlocked}
              flag={flag}
              setFlag={setFlag}
              restore={() => {
                resetTheme();
                setWallpaper("stars");
                setOrnaments(true);
                setFlag(false);
              }}
            />
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
          </div>
        </main>
        <footer>
          <a href="#home">{t("回到顶部")}</a>
          <span>{t("月球洞口 · 留下一点脚印")}</span>
          <p>
            {t("2005–2008 Qzone 风格练习 · 全部人物、图片与内容均为虚构演示")}
          </p>
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
