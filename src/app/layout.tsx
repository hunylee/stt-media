import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Airport STT-Gloss | 공항 실시간 자막 서비스",
  description:
    "청각장애인을 위한 공항 전용 실시간 음성인식 + 수어 글로스 이중 자막 웹앱. Whisper AI 기반 한국어 음성인식과 수어 글로스 자막을 동시에 제공합니다.",
  keywords: ["공항", "수어", "자막", "청각장애", "STT", "음성인식", "Whisper"],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
