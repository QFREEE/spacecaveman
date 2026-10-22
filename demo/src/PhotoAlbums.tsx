import { useLegacyLanguage as useLanguage } from "./legacy/Language";
import { useRef, useState } from "react";
import { albums, type Album } from "./data";
import { ModuleFrame } from "./ModuleFrame";

export function PhotoAlbums() {
  const { t } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const [album, setAlbum] = useState<Album>(albums[0]);
  function open(item: Album) {
    setAlbum(item);
    dialog.current?.showModal();
  }
  return (
    <ModuleFrame
      id="albums"
      title={t("我的相册")}
      english="MOON IN FRAMES"
      icon="photo"
      className="albums"
      extra={<span className="heading-note">{t("2 本相册")}</span>}
    >
      <div className="album-grid">
        {albums.map((item) => (
          <button
            className="album"
            key={item.id}
            onClick={() => open(item)}
            aria-label={`${t("打开相册：")}${t(item.title)}`}
          >
            <span className="photo-frame">
              <img
                src={item.image}
                alt={t(item.alt)}
                width="236"
                height="130"
              />
            </span>
            <span className="album-caption">
              <b>{t(item.title)}</b>
              <small>
                {item.count}
                {t("张")}
              </small>
            </span>
            <span className="album-subtitle">{t(item.subtitle)}</span>
          </button>
        ))}
      </div>
      <dialog ref={dialog} aria-labelledby="album-title">
        <div className="dialog-heading">
          <h2 id="album-title">{t(album.title)}</h2>
          <button
            className="bevel"
            onClick={() => dialog.current?.close()}
            autoFocus
          >
            {t("关闭相册")}
          </button>
        </div>
        <img className="album-full" src={album.image} alt={t(album.alt)} />
        <p>{t(album.subtitle)} · 1 / 1</p>
        <p className="fine-print">{t("原创简笔画 · 虚构相册")}</p>
      </dialog>
    </ModuleFrame>
  );
}
