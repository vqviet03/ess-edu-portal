import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import Providers from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ESS · Báo cáo học tập",
  description: "Báo cáo kết quả học tập, điểm kỹ năng và tài liệu theo lớp.",
  icons: { icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/favicon.svg` },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body><AppRouterCacheProvider><Providers>{children}</Providers></AppRouterCacheProvider></body></html>;
}
