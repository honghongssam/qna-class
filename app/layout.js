import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "🏫 우리반 질문 광장 - Study Board",
  description: "학생들이 모르는 것을 서로 질문하고 답하며 복습하는 소통형 학습 공간",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        {/* FontAwesome 아이콘 스타일시트 추가 */}
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" 
          precedence="default"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
