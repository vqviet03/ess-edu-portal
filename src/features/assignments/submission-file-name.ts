export function submissionAudioBase(
  title: string,
  question: number,
  unit: number | null,
) {
  const clean = title
    .normalize("NFC")
    .replace(/[\p{Cc}<>:"/\\|?*]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `Bài nộp ${question} - ${Array.from(clean || "Bài tập")
    .slice(0, 100)
    .join("")}${unit == null ? "" : ` - Unit ${unit}`}`;
}
export function submissionAudioFileName(
  base: string,
  file: Pick<File, "name" | "type">,
) {
  const ext =
    file.name.match(/\.([a-zA-Z0-9]{1,8})$/)?.[1]?.toLowerCase() ??
    ({
      "audio/mp4": "m4a",
      "audio/mpeg": "mp3",
      "audio/ogg": "ogg",
      "audio/wav": "wav",
    }[file.type] ||
      "webm");
  return `${base}.${ext}`;
}
