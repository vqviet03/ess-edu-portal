import { registerWorker } from "../pwa/platform";
import { hydrateRoot } from "react-dom/client";
import { PublicIntroductionApp } from "./public-app";
import type { IntroductionContent } from "./models";
const root = document.getElementById("ees-introduction-root"),
  data = document.getElementById("ees-introduction-data");
if (root && data) {
  const payload = JSON.parse(data.textContent ?? "null") as {
    content: IntroductionContent;
    assetsBase: string;
  } | null;
  if (payload) hydrateRoot(root, <PublicIntroductionApp {...payload} />);
}

if ("serviceWorker" in navigator) void registerWorker().catch(() => {});
