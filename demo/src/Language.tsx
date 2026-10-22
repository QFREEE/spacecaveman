import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { en, type MessageKey } from "./i18n/en";
import { zh } from "./i18n/zh";

type Language = "en" | "zh";
const catalogs = { en, zh };

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: MessageKey) => string;
};
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const messages = catalogs[language];
  const t = (key: MessageKey) => messages[key];

  useEffect(() => {
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
    document.title = messages["site.title"];
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", messages["site.description"]);
  }, [language, messages]);

  return (
    <LanguageContext value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage requires LanguageProvider");
  return context;
}

export function LanguageSwitch() {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div
      className="language-switch"
      role="group"
      aria-label={t("language.label")}
    >
      <button
        type="button"
        lang="en"
        aria-pressed={language === "en"}
        onClick={() => setLanguage("en")}
      >
        English
      </button>
      <button
        type="button"
        lang="zh-CN"
        aria-pressed={language === "zh"}
        onClick={() => setLanguage("zh")}
      >
        中文
      </button>
    </div>
  );
}
