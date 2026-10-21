import { useLanguage, LanguageProvider, LanguageSwitch } from "./Language";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { Profile } from "./Profile";
import { Diary } from "./Diary";
import { MeetupAvailability } from "./MeetupAvailability";
import { PhotoAlbums } from "./PhotoAlbums";
import { MusicPlayer } from "./MusicPlayer";
import { Guestbook } from "./Guestbook";
import { ModuleFrame } from "./ModuleFrame";
import "./style.css";

function App() {
  const { t } = useLanguage();
  return (
    <>
      <div className="topbar">
        <div>
          <a href="#home" className="top-brand">
            <span className="pixel-icon icon-home" aria-hidden="true" />
            {t("晴空小站")}
          </a>
          <span className="top-tag">{t("一页旧时光")}</span>
          <a href="#guestbook">{t("留言给小屿")}</a>
          <LanguageSwitch />
          <span className="demo-badge">{t("虚构空间 · DEMO")}</span>
        </div>
      </div>
      <div className="site" id="home">
        <header className="masthead">
          <div className="site-number">NO. 00816 / SUMMER, 2007</div>
          <h1>{t("晴空小站")}</h1>
          <p>{t("夏天慢慢走，我们慢慢说。")}</p>
          <span className="header-note">
            {t("有风经过的地方，就有好心情。")}
          </span>
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
          <span>{t("小站公告：把快乐存进这里，也把晴天分你一点。")}</span>
          <span className="welcome-date">{t("2007.08.18 晴")}</span>
        </div>
        <main className="modules">
          <Profile />
          <Diary />
          <MeetupAvailability />
          <PhotoAlbums />
          <MusicPlayer />
          <Guestbook />
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
        </main>
        <footer>
          <a href="#home">{t("回到顶部")}</a>
          <span>{t("晴空小站 · 留住一点夏天")}</span>
          <p>
            {t("2005–2008 Qzone 风格练习 · 全部人物、图片与内容均为虚构演示")}
          </p>
        </footer>
      </div>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </StrictMode>,
);
