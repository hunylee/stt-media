import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Airport STT-Gloss | 공항 실시간 자막 서비스",
  description:
    "청각장애인을 위한 공항 전용 실시간 음성인식 + 수어 글로스 이중 자막 웹앱. Whisper AI 기반 한국어 음성인식과 수어 글로스 자막을 동시에 제공합니다.",
  keywords: ["공항", "수어", "자막", "청각장애", "STT", "음성인식", "Whisper"],
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
    <html lang="ko">
      <body className={notoSansKr.className}>{children}</body>
    </html>
  );
}
