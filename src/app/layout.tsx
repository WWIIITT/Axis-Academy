import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Axis Academy",
  description: "Teacher-facing AI lesson production workflow platform"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
