import type { ComponentType } from "react";
import { LunarScene } from "../LunarScene";
import "./lunar.css";
import "./blue-hour.css";

type SpaceTheme = {
  id: string;
  label: string;
  Scene: ComponentType;
  portrait: { src: string; alt: string };
};

// Add a theme here and import its CSS above. Feature modules never depend on IDs.
export const themes = [
  {
    id: "lunar",
    label: "月球黑白",
    Scene: LunarScene,
    portrait: {
      src: "/assets/caveman.svg",
      alt: "戴着泡泡头盔的虚构月球穴居人",
    },
  },
  {
    id: "blue-hour",
    label: "月光蓝",
    Scene: LunarScene,
    portrait: {
      src: "/assets/caveman.svg",
      alt: "戴着泡泡头盔的虚构月球穴居人",
    },
  },
] as const satisfies readonly SpaceTheme[];

export type ThemeId = (typeof themes)[number]["id"];
export const defaultTheme = themes[0];
