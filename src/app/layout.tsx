import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "공항 소통 도우미 | Airport Communication Helper",
  description:
    "청각장애인을 위한 공항 소통 도우미. 공항 스태프에게 화면을 보여주면 한국어 + 수어 글로스 + 영어로 소통할 수 있습니다.",
  keywords: ["공항", "수어", "청각장애인", "소통", "장애인", "공항 문장", "어시스티브", "글로스"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={notoSansKr.className} suppressHydrationWarning>{children}</body>
    </html>
  );
}
