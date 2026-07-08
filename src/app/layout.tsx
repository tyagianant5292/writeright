import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const sora = Sora({
  variable: "--font-sora",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "WriteRight by infinityagi — AI English Coach",
    template: "%s | WriteRight",
  },
  description:
    "Type in English and get instant AI feedback — grammar, vocabulary, sentence structure, spelling and pronunciation scores, corrections with explanations, and a daily word to grow your vocabulary.",
  keywords: [
    "english grammar checker",
    "learn english",
    "ai writing coach",
    "improve english",
    "vocabulary daily words",
  ],
  openGraph: {
    title: "WriteRight — AI English Writing Coach",
    description:
      "Instant AI feedback on your English — grammar, vocabulary, sentences, pronunciation. Plus a new word every day.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
