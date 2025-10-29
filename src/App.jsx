import { useEffect, useRef, useState } from "react";
import "./App.css";

// convert "hh:mm:ss,ms" string into total seconds
function toSec(t) {
  const [h, m, s] = t.replace(",", ".").split(":");
  return +h * 3600 + +m * 60 + +s;
}

// Convert SRT subtitles into an array of objects with {start, end, text}.
function parseSRT(srt) {
  return srt
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split("\n");
      const [start, end] = lines[1].split("-->").map((t) => toSec(t.trim()));
      return { start, end, text: lines.slice(2).join(" ") };
    })
    .filter((l) => l.text);
}

export default function App() {
  const audioRef = useRef(null);
  const lyricsRef = useRef(null);
  const [lyrics, setLyrics] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Jump audio to the clicked lyric's start time
  const handleClick = (i) => {
    const audio = audioRef.current;
    audio.currentTime = lyrics[i].start;
    audio.play();
  };

  // Load SRT file and set lyrics on start
  useEffect(() => {
    fetch("/audio/Ordinary.srt")
      .then((res) => res.text())
      .then((text) => setLyrics(parseSRT(text)))
      .catch(console.error);
  }, []);

  // Update the current lyric index as the audio plays
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      const t = audio.currentTime;
      const index = lyrics.findIndex(
        (l, i) => t >= l.start && t < (lyrics[i + 1]?.start || Infinity)
      );
      setCurrentIndex(index);
    };

    audio.addEventListener("timeupdate", updateTime);
    return () => audio.removeEventListener("timeupdate", updateTime);
  }, [lyrics]);

  // Keep the current lyric centered in the view
  useEffect(() => {
    if (currentIndex < 0) return;
    const container = lyricsRef.current;
    const line = container.children[currentIndex];
    if (line) {
      const scrollTo =
        line.offsetTop - container.clientHeight / 2 + line.clientHeight / 2;
      container.scrollTo({ top: scrollTo, behavior: "smooth" });
    }
  }, [currentIndex]);

  return (
    <div className="lyrics-container">
      <h2>🎵 Ordinary - Lyrics</h2>

      <div className="lyric-display" ref={lyricsRef}>
        {lyrics.map((l, i) => (
          <p
            key={i}
            className={i === currentIndex ? "highlighted" : "normal-line"}
            onClick={() => handleClick(i)}
          >
            {l.text}
          </p>
        ))}
      </div>

      <audio ref={audioRef} controls src="/audio/Ordinary.mp3" />
    </div>
  );
}
