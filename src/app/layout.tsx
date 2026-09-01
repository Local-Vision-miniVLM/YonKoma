import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YonKoma — 日記を四コマに",
  description: "日記からテーマと落ちを抜き、鉛筆ラフ風の四コマを作る",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
