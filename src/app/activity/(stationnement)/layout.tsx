import type { Metadata } from "next";
import StationnementLayoutClient from "./StationnementLayoutClient";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "Stationnement — Taxe de stationnement",
  description: "Gestion de la taxe de stationnement",
};

export default function StationnementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <StationnementLayoutClient>{children}</StationnementLayoutClient>
    </ThemeProvider>
  );
}
