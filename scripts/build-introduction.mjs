import { build } from "esbuild";
import { mkdir, copyFile } from "node:fs/promises";
await mkdir("public/introduction/fonts", { recursive: true });
// Local fonts keep both SEO rendering and hydration independent of third-party font requests.
for (const part of ["latin", "vietnamese"])
  for (const weight of [400, 700])
    await copyFile(
      `node_modules/@fontsource/roboto/files/roboto-${part}-${weight}-normal.woff2`,
      `public/introduction/fonts/${part}-${weight}.woff2`,
    );
await build({
  entryPoints: ["src/features/introduction/client-entry.tsx"],
  bundle: true,
  minify: true,
  format: "esm",
  outfile: "public/introduction/client.js",
  platform: "browser",
  define: {
    "process.env.NODE_ENV": '"production"',
    "process.env.NEXT_PUBLIC_BASE_PATH": '""',
  },
  logLevel: "warning",
});
