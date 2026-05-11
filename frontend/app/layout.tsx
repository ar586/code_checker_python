import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PyExec — Python Code Execution Engine",
  description:
    "A real-time Python code execution engine. Write, run, and see the output instantly — with a strict 2-second timeout to prevent infinite loops.",
  keywords: ["python", "code editor", "online compiler", "execution engine"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
