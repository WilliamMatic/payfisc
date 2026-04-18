import type { Metadata } from "next";
import EnvironnementLayoutClient from "./EnvironnementLayoutClient";
import { ThemeProvider } from "@/contexts/ThemeContext";

export const metadata: Metadata = {
  title: "Environnement — Taxe d'environnement",
  description: "Gestion de la taxe d'environnement",
};

export default function EnvironnementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <EnvironnementLayoutClient>{children}</EnvironnementLayoutClient>
    </ThemeProvider>
  );
}
