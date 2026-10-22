import { useLegacyLanguage as useLanguage } from "./legacy/Language";
import { useState, type FormEvent } from "react";
import { messages, type Message } from "./data";
import { ModuleFrame } from "./ModuleFrame";
import { useTheme } from "./themes/ThemeProvider";

export function Guestbook() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [entries, setEntries] = useState<Message[]>(messages);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !text.trim()) {
      setNotice("请填写昵称和留言内容。");
      return;
    }
    setEntries((prev) => [
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        text: text.trim(),
        date: "本次演示 · 刚刚",
      },
      ...prev,
    ]);
    setText("");
    setNotice("留言已添加到本页。仅本地演示，刷新后重置。");
  }
  return (
    <ModuleFrame
      id="guestbook"
      title={t("留言板")}
      english="LEAVE A LITTLE HELLO"
      icon="message"
      className="guestbook"
      extra={<span className="heading-note">{t("本地演示")}</span>}
    >
      <p className="guest-intro">{t("来过，就留下一点点声音吧。")}</p>
      <form onSubmit={submit} noValidate>
        <label className="name-label">
          {t("你的昵称")}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoComplete="off"
            placeholder={t("给自己起个名字")}
          />
        </label>
        <label className="message-label">
          {t("留言内容")}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={300}
            rows={3}
            placeholder={t("今天的心情是什么颜色？")}
          />
        </label>
        <div className="form-bottom">
          <span>
            {text.length}
            {t("/300 · 刷新后重置")}
          </span>
          <button type="submit" className="bevel">
            {t("发表留言")}
          </button>
        </div>
        <p className="form-notice" role="status">
          {t(notice)}
        </p>
      </form>
      <div className="messages" aria-label={t("留言列表")}>
        {entries.map((entry, index) => (
          <article className="message" key={entry.id}>
            <span className="message-avatar" aria-hidden="true">
              <img src={theme.portrait.src} alt="" />
            </span>
            <div>
              <div className="message-byline">
                <strong>{entry.sample ? t(entry.name) : entry.name}</strong>
                <span>
                  {index + 1}
                  {t("楼")}
                </span>
              </div>
              <p>{entry.sample ? t(entry.text) : entry.text}</p>
              <time>{t(entry.date)}</time>
            </div>
          </article>
        ))}
      </div>
      <p className="fine-print">
        {t("留言只保存在当前页面，不会发送到服务器。")}
      </p>
    </ModuleFrame>
  );
}
