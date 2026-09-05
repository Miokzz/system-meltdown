import type { Metadata } from "next";
import "@/styles/globals.css";
export const metadata: Metadata = {
  title: "SYSTEM MELTDOWN — Experimental Unit 06",
  description:
    "An experimental machine. A very bad idea. Explore, disassemble, and destroy a fully interactive 3D computer.",
  icons: { icon: "/favicon.svg" },
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
