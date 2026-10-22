import { useLegacyLanguage as useLanguage } from "./legacy/Language";
import { useRef, useState } from "react";
import { ModuleFrame } from "./ModuleFrame";

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
export function MusicPlayer() {
  const { t } = useLanguage();
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(24);
  const [volume, setVolume] = useState(0.45);
  const [error, setError] = useState(false);
  async function toggle() {
    if (!audio.current) return;
    if (audio.current.paused) {
      try {
        await audio.current.play();
      } catch {
        setError(true);
      }
    } else audio.current.pause();
  }
  return (
    <ModuleFrame
      id="music"
      title={t("音乐盒")}
      english="ON REPEAT"
      icon="music"
      className="music"
    >
      <div className={`music-cover ${playing && !error ? "is-playing" : ""}`}>
        <span className="record-disc" aria-hidden="true">
          <i />
        </span>
        <div>
          <span>{t("正在收藏的旋律")}</span>
          <h3>{t("来自地球的旋律")}</h3>
          <p>{t("小咕的八音盒")}</p>
        </div>
      </div>
      <div
        className={`equalizer ${playing && !error ? "is-playing" : ""}`}
        aria-hidden="true"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <i key={i} style={{ animationDelay: `${(i % 4) * -0.18}s` }} />
        ))}
      </div>
      <audio
        ref={audio}
        preload="metadata"
        src="/assets/summer.wav"
        onLoadedMetadata={() => {
          if (audio.current) {
            audio.current.volume = volume;
            setDuration(audio.current.duration);
          }
        }}
        onPlaying={() => setPlaying(true)}
        onWaiting={() => setPlaying(false)}
        onStalled={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={() => setTime(audio.current?.currentTime ?? 0)}
        onError={() => {
          setError(true);
          setPlaying(false);
        }}
      />
      <div className="player-display">
        <span>
          {error
            ? t("音乐暂时无法载入")
            : playing
              ? t("正在播放…")
              : time >= duration
                ? t("播放完毕")
                : t("已暂停 · 点击播放")}
        </span>
        <span>
          {clock(time)} / {clock(duration)}
        </span>
      </div>
      <label className="sr-only" htmlFor="seek">
        {t("播放进度")}
      </label>
      <input
        id="seek"
        className="seek"
        type="range"
        min="0"
        max={duration}
        step="0.1"
        value={time}
        onChange={(e) => {
          const value = Number(e.target.value);
          if (audio.current) audio.current.currentTime = value;
          setTime(value);
        }}
      />
      <div className="music-controls">
        <button
          className="bevel play-button"
          onClick={toggle}
          disabled={error}
          aria-label={playing ? t("暂停音乐") : t("播放音乐")}
        >
          {playing ? t("暂停") : t("播放")}
        </button>
        <button
          className="bevel"
          onClick={() => {
            audio.current?.pause();
            if (audio.current) audio.current.currentTime = 0;
            setTime(0);
          }}
        >
          {t("停止")}
        </button>
        <label>
          {t("音量")}{" "}
          <input
            aria-label={t("音量")}
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => {
              const value = Number(e.target.value);
              setVolume(value);
              if (audio.current) audio.current.volume = value;
            }}
          />
        </label>
      </div>
      <p className="fine-print">{t("原创演示旋律 · 24秒 · 不自动播放")}</p>
    </ModuleFrame>
  );
}
