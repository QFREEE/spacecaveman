import { createContext, useContext, useState, type ReactNode } from "react";
import { defaultTheme, themes, type ThemeId } from "./registry";

function useThemeState() {
  const [themeId, setThemeId] = useState<ThemeId>(defaultTheme.id);
  const theme = themes.find((item) => item.id === themeId) ?? defaultTheme;
  return {
    theme,
    themes,
    setThemeId,
    resetTheme: () => setThemeId(defaultTheme.id),
  };
}

const ThemeContext = createContext<ReturnType<typeof useThemeState> | null>(
  null,
);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const value = useThemeState();
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme requires ThemeProvider");
  return value;
}
