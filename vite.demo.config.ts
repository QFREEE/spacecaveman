import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { en } from "./demo/src/i18n/en.ts";

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}

export default defineConfig({
  root: "demo",
  plugins: [
    react(),
    {
      name: "homepage-metadata",
      transformIndexHtml: {
        order: "pre",
        handler: (html) =>
          html
            .replace("%SITE_TITLE%", escapeHtml(en["site.title"]))
            .replace("%SITE_DESCRIPTION%", escapeHtml(en["site.description"])),
      },
    },
  ],
  server: { host: "127.0.0.1", port: 4173, strictPort: true },
  preview: { host: "127.0.0.1", port: 4174, strictPort: true },
  build: { outDir: "../dist/qzone-demo", emptyOutDir: true },
});
