"use client";
import { useAudioTimeline } from "@/shared/audio-timeline";
import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Slider from "@mui/material/Slider";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Pause from "@mui/icons-material/Pause";
export const recordingTime = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(s % 60)
    .toString()
    .padStart(2, "0")}`;
export function RecordingAudio({ source }: { source: string }) {
  const ref = useRef<HTMLAudioElement>(null),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [error, setError] = useState(false);
  const { position, duration } = useAudioTimeline(ref, source);
  useEffect(() => {
    const node = ref.current;
    return () => {
      node?.pause();
      if (node) node.removeAttribute("src");
    };
  }, []);
  return (
    <Box
      sx={{
        p: 1.5,
        bgcolor: "var(--a-recording-bg)",
        color: "var(--a-recording-fg)",
        borderRadius: "12px",
        maxWidth: 460,
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <IconButton
          aria-label={playing ? "Tạm dừng bản ghi" : "Nghe bản ghi"}
          sx={{
            borderRadius: "50%",
            bgcolor: "var(--a-recording-accent)",
            color: "var(--a-recording-bg)",
          }}
          onClick={() => {
            const a = ref.current;
            if (!a) return;
            if (a.paused) void a.play().catch(() => setError(true));
            else a.pause();
          }}
        >
          {playing ? <Pause /> : <PlayArrow />}
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>
            Bản ghi bài nộp
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", flexWrap: "wrap" }}
          >
            <Slider
              aria-label="Tua bản ghi"
              size="small"
              sx={{ flex: 1, minWidth: 80, color: "var(--a-recording-accent)" }}
              min={0}
              disabled={!duration}
              max={duration || Math.max(position, 1)}
              value={Math.min(position, duration || position)}
              onChange={(_, v) => {
                if (ref.current) ref.current.currentTime = v as number;
              }}
            />
            <Typography variant="body2">
              {recordingTime(position)} /{" "}
              {duration ? recordingTime(duration) : "--:--"}
            </Typography>
            <Select
              variant="standard"
              disableUnderline
              value={speed}
              onChange={(e) => {
                const value = Number(e.target.value);
                setSpeed(value);
                if (ref.current) ref.current.playbackRate = value;
              }}
              inputProps={{ "aria-label": "Tốc độ bản ghi" }}
              sx={{ fontSize: 12 }}
            >
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((n) => (
                <MenuItem key={n} value={n}>
                  ×{n}
                </MenuItem>
              ))}
            </Select>
          </Stack>
        </Box>
      </Stack>
      <audio
        ref={ref}
        src={source}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={() => setError(true)}
      />
      {error && (
        <Typography color="error">
          Không phát được bản ghi. Hãy ghi lại.
        </Typography>
      )}
    </Box>
  );
}
