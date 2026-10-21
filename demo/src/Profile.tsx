import { useLanguage } from "./Language";
import { ModuleFrame } from "./ModuleFrame";
import { profile } from "./data";
import { useTheme } from "./themes/ThemeProvider";

export function Profile() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  return (
    <ModuleFrame
      id="profile"
      title={t("个人档")}
      english="ABOUT ME"
      icon="profile"
      className="profile"
    >
      <div className="portrait">
        <img
          src={theme.portrait.src}
          width="130"
          height="130"
          alt={t(theme.portrait.alt)}
        />
      </div>
      <h3>
        {t(profile.name)}
        <span className="online">{t("在线")}</span>
      </h3>
      <p className="motto">{t(profile.motto)}</p>
      <dl>
        <div>
          <dt>{t("现居")}</dt>
          <dd>{t(profile.location)}</dd>
        </div>
        <div>
          <dt>{t("生日")}</dt>
          <dd>{t(profile.birthday)}</dd>
        </div>
        <div>
          <dt>{t("喜欢")}</dt>
          <dd>{t(profile.interests)}</dd>
        </div>
      </dl>
      <p className="profile-note">
        {t("一个在月球上乱逛的人。")}
        <br /> {t("欢迎来我的小小空间坐坐。")}
      </p>
      <a className="bevel guest-link" href="#guestbook">
        {t("给我留言")}
      </a>
      <div className="profile-stats">
        <span>
          {t("日志")}
          <b>02</b>
        </span>
        <span>
          {t("相册")}
          <b>02</b>
        </span>
        <span>
          {t("心情")}
          <b>{t("晴")}</b>
        </span>
      </div>
    </ModuleFrame>
  );
}
