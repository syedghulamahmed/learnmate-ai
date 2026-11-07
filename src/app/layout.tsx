import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnMate AI | Personalized Learning Assistant",
  description: "An AI tutor that adapts explanations and learning guidance to each learner.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
